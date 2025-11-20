/**
 * Provider Repository
 *
 * Data access layer for Provider entities.
 * Handles all Prisma queries related to providers.
 */

import { Provider, PrismaClient, Prisma, PageType } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { CreateProviderInput, UpdateProviderInput } from '../dtos';
import { toInputJsonValue } from '../utils/json-helpers';
import { generateJitteredKeyBetween } from 'fractional-indexing-jittered';
import { wikiContentToTipTap, tipTapToPlainText } from '../utils/content-transformers';
import { JSONContent } from '@tiptap/core';

/**
 * Provider with page relation included
 */
export type ProviderWithPage = Provider & {
  page: {
    id: string;
    slug: string;
    title: string;
    content: Prisma.JsonValue;
    textContent: string | null;
    type: PageType;
    icon: string | null;
    coverPhoto: string | null;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

export class ProviderRepository extends BaseRepository<Provider, CreateProviderInput, UpdateProviderInput> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Find a provider by ID
   */
  async findById(id: string): Promise<Provider | null> {
    return this.prisma.provider.findUnique({
      where: { id },
    });
  }

  /**
   * Find a provider by slug with page relation
   */
  async findBySlugWithPage(slug: string): Promise<ProviderWithPage | null> {
    return this.prisma.provider.findUnique({
      where: { slug },
      include: { page: true },
    });
  }

  /**
   * Find multiple providers
   */
  async findMany(): Promise<Provider[]> {
    return this.prisma.provider.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create a new provider with associated page
   */
  async create(data: CreateProviderInput): Promise<Provider> {
    const position = generateJitteredKeyBetween(null, null);
    const title = data.credentials ? `${data.name}, ${data.credentials}` : data.name;

    // Prepare page content from WikiContent if provided
    let pageContent: JSONContent = { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
    let textContent = title;

    if (data.wikiContent) {
      pageContent = wikiContentToTipTap(data.wikiContent);
      textContent = tipTapToPlainText(pageContent);
    }

    return this.prisma.provider.create({
      data: {
        slug: data.slug,
        name: data.name,
        credentials: data.credentials,
        generalDifficulty: data.generalDifficulty,
        speedDifficulty: data.speedDifficulty,
        terminologyDifficulty: data.terminologyDifficulty,
        noteDifficulty: data.noteDifficulty,
        noteTemplate: data.noteTemplate,
        noteSmartPhrase: data.noteSmartPhrase,
        preferences: data.preferences ? toInputJsonValue(data.preferences) : Prisma.JsonNull,
        wikiContent: data.wikiContent ? toInputJsonValue(data.wikiContent) : Prisma.JsonNull,
        page: {
          create: {
            slug: data.slug,
            title,
            content: toInputJsonValue(pageContent),
            textContent,
            type: PageType.PROVIDER,
            position,
            icon: '👨‍⚕️',
          },
        },
      },
    });
  }

  /**
   * Update a provider and sync with associated page
   */
  async updateWithPageSync(providerId: string, data: UpdateProviderInput): Promise<ProviderWithPage> {
    return this.prisma.$transaction(async (tx) => {
      // Update provider
      const provider = await tx.provider.update({
        where: { id: providerId },
        data: {
          name: data.name,
          credentials: data.credentials,
          generalDifficulty: data.generalDifficulty,
          speedDifficulty: data.speedDifficulty,
          terminologyDifficulty: data.terminologyDifficulty,
          noteDifficulty: data.noteDifficulty,
          noteTemplate: data.noteTemplate,
          noteSmartPhrase: data.noteSmartPhrase,
          preferences: data.preferences !== undefined
            ? (data.preferences ? toInputJsonValue(data.preferences) : Prisma.JsonNull)
            : undefined,
          wikiContent: data.wikiContent !== undefined
            ? (data.wikiContent ? toInputJsonValue(data.wikiContent) : Prisma.JsonNull)
            : undefined,
        },
        include: { page: true },
      });

      // Prepare page update data
      const pageData: {
        title?: string;
        content?: Prisma.InputJsonValue;
        textContent?: string;
      } = {};

      if (data.name !== undefined || data.credentials !== undefined) {
        const name = data.name ?? provider.name;
        const credentials = data.credentials ?? provider.credentials;
        pageData.title = credentials ? `${name}, ${credentials}` : name;
      }

      if (data.wikiContent !== undefined && data.wikiContent !== null) {
        const content = wikiContentToTipTap(data.wikiContent);
        pageData.content = toInputJsonValue(content);
        pageData.textContent = tipTapToPlainText(content);
      }

      // Update associated page if it exists and there's data to update
      if (provider.page && Object.keys(pageData).length > 0) {
        await tx.page.update({
          where: { providerId },
          data: pageData,
        });
      }

      // Return updated provider with page
      return tx.provider.findUnique({
        where: { id: providerId },
        include: { page: true },
      }) as Promise<ProviderWithPage>;
    });
  }

  /**
   * Simple update without page sync
   */
  async update(id: string, data: UpdateProviderInput): Promise<Provider> {
    return this.prisma.provider.update({
      where: { id },
      data: {
        name: data.name,
        credentials: data.credentials,
        generalDifficulty: data.generalDifficulty,
        speedDifficulty: data.speedDifficulty,
        terminologyDifficulty: data.terminologyDifficulty,
        noteDifficulty: data.noteDifficulty,
        noteTemplate: data.noteTemplate,
        noteSmartPhrase: data.noteSmartPhrase,
        preferences: data.preferences !== undefined
          ? (data.preferences ? toInputJsonValue(data.preferences) : Prisma.JsonNull)
          : undefined,
        wikiContent: data.wikiContent !== undefined
          ? (data.wikiContent ? toInputJsonValue(data.wikiContent) : Prisma.JsonNull)
          : undefined,
      },
    });
  }

  /**
   * Delete a provider
   */
  async delete(id: string): Promise<void> {
    await this.prisma.provider.delete({
      where: { id },
    });
  }

  /**
   * Find top providers by view count
   */
  async findTopProviders(limit = 10): Promise<Provider[]> {
    return this.prisma.provider.findMany({
      orderBy: { viewCount: 'desc' },
      take: limit,
    });
  }

  /**
   * Search providers by name
   */
  async search(query: string): Promise<Provider[]> {
    return this.prisma.provider.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { credentials: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.provider.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }
}
