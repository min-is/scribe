/**
 * Provider Repository
 *
 * Data access layer for Provider operations.
 */

import { PrismaClient, Provider, Page } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { toInputJsonValue } from '../utils/json-helpers';

export type ProviderWithPage = Provider & { page: Page | null };

export class ProviderRepository extends BaseRepository<Provider> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected getModel() {
    return this.prisma.provider;
  }

  /**
   * Find a provider by slug
   */
  async findBySlug(slug: string): Promise<Provider | null> {
    return await this.prisma.provider.findUnique({
      where: { slug },
    });
  }

  /**
   * Find a provider by slug with associated page
   */
  async findBySlugWithPage(slug: string): Promise<ProviderWithPage | null> {
    return await this.prisma.provider.findUnique({
      where: { slug },
      include: { page: true },
    });
  }

  /**
   * Create a new provider with associated page
   */
  async createWithPage(
    providerData: Prisma.ProviderCreateInput,
    pageData: Prisma.PageCreateInput
  ): Promise<ProviderWithPage> {
    return await this.prisma.provider.create({
      data: {
        ...providerData,
        page: {
          create: pageData,
        },
      },
      include: { page: true },
    });
  }

  /**
   * Update provider with proper JSON handling
   */
  async updateProvider(
    id: string,
    data: {
      name?: string;
      credentials?: string;
      generalDifficulty?: number;
      speedDifficulty?: number;
      terminologyDifficulty?: number;
      noteDifficulty?: number;
      noteTemplate?: string;
      noteSmartPhrase?: string;
      preferences?: unknown;
      wikiContent?: unknown;
    }
  ): Promise<Provider> {
    return await this.prisma.provider.update({
      where: { id },
      data: {
        name: data.name,
        credentials: data.credentials ?? undefined,
        generalDifficulty: data.generalDifficulty ?? undefined,
        speedDifficulty: data.speedDifficulty ?? undefined,
        terminologyDifficulty: data.terminologyDifficulty ?? undefined,
        noteDifficulty: data.noteDifficulty ?? undefined,
        noteTemplate: data.noteTemplate ?? undefined,
        noteSmartPhrase: data.noteSmartPhrase ?? undefined,
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
   * Update provider and associated page in a transaction
   */
  async updateWithPageSync(
    providerId: string,
    providerData: any,
    pageData: any
  ): Promise<ProviderWithPage> {
    return await this.prisma.$transaction(async (tx) => {
      // Update provider
      const provider = await tx.provider.update({
        where: { id: providerId },
        data: providerData,
      });

      // Update associated page if it exists
      if (provider.page) {
        await tx.page.update({
          where: { providerId },
          data: pageData,
        });
      }

      // Return provider with page
      return await tx.provider.findUnique({
        where: { id: providerId },
        include: { page: true },
      }) as ProviderWithPage;
    });
  }

  /**
   * Find top providers by view count
   */
  async findTopProviders(limit: number): Promise<Provider[]> {
    return await this.prisma.provider.findMany({
      orderBy: { viewCount: 'desc' },
      take: limit,
    });
  }

  /**
   * Search providers by name
   */
  async search(query: string): Promise<Provider[]> {
    return await this.prisma.provider.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { credentials: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { viewCount: 'desc' },
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

  /**
   * Increment search click count
   */
  async incrementSearchClickCount(id: string): Promise<void> {
    await this.prisma.provider.update({
      where: { id },
      data: { searchClickCount: { increment: 1 } },
    });
  }
}
