/**
 * Provider Repository
 *
 * Data access layer for Provider model operations.
 * Encapsulates all Prisma queries related to providers.
 *
 * IMPORTANT: When accessing provider.page, the query MUST include { page: true }
 * in the include clause to avoid TypeScript errors.
 */

import { PrismaClient, Provider, Page, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { CreateProviderInput, UpdateProviderInput } from '../dtos/provider.dto';
import { toInputJsonValue } from '../utils/json-helpers';

// Type for Provider with Page relation
export type ProviderWithPage = Provider & { page: Page | null };

export class ProviderRepository extends BaseRepository<Provider> {
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
    const provider: ProviderWithPage | null = await this.prisma.provider.findUnique({
      where: { slug },
      include: { page: true }, // CRITICAL: Include page relation
    });

    return provider;
  }

  /**
   * Find all providers
   */
  async findAll(): Promise<Provider[]> {
    return this.prisma.provider.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Create a new provider
   */
  async create(data: CreateProviderInput): Promise<Provider> {
    return this.prisma.provider.create({
      data: {
        slug: data.slug,
        name: data.name,
        credentials: data.credentials ?? null,
        generalDifficulty: data.generalDifficulty ?? null,
        speedDifficulty: data.speedDifficulty ?? null,
        terminologyDifficulty: data.terminologyDifficulty ?? null,
        noteDifficulty: data.noteDifficulty ?? null,
        noteTemplate: data.noteTemplate ?? null,
        noteSmartPhrase: data.noteSmartPhrase ?? null,
        preferences: data.preferences !== undefined ? toInputJsonValue(data.preferences) : Prisma.JsonNull,
        wikiContent: data.wikiContent !== undefined ? toInputJsonValue(data.wikiContent) : Prisma.JsonNull,
      },
    });
  }

  /**
   * Update an existing provider
   */
  async update(id: string, data: UpdateProviderInput): Promise<Provider> {
    return this.prisma.provider.update({
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
        preferences: data.preferences !== undefined ? toInputJsonValue(data.preferences) : undefined,
        wikiContent: data.wikiContent !== undefined ? toInputJsonValue(data.wikiContent) : undefined,
      },
    });
  }

  /**
   * Update provider with page synchronization
   * This ensures Provider and Page data stay in sync.
   */
  async updateWithPageSync(
    providerId: string,
    providerData: UpdateProviderInput,
    pageData?: {
      title?: string;
      content?: Prisma.InputJsonValue;
      textContent?: string;
    },
  ): Promise<ProviderWithPage> {
    return this.prisma.$transaction(async (tx) => {
      // Update provider
      const provider: ProviderWithPage = await tx.provider.update({
        where: { id: providerId },
        data: {
          name: providerData.name,
          credentials: providerData.credentials ?? undefined,
          generalDifficulty: providerData.generalDifficulty ?? undefined,
          speedDifficulty: providerData.speedDifficulty ?? undefined,
          terminologyDifficulty: providerData.terminologyDifficulty ?? undefined,
          noteDifficulty: providerData.noteDifficulty ?? undefined,
          noteTemplate: providerData.noteTemplate ?? undefined,
          noteSmartPhrase: providerData.noteSmartPhrase ?? undefined,
          preferences: providerData.preferences !== undefined ? toInputJsonValue(providerData.preferences) : undefined,
          wikiContent: providerData.wikiContent !== undefined ? toInputJsonValue(providerData.wikiContent) : undefined,
        },
        include: { page: true }, // CRITICAL: Include page relation
      });

      // Update associated page if it exists AND pageData is provided
      if (provider.page && pageData) {
        await tx.page.update({
          where: { providerId },
          data: pageData,
        });
      }

      return provider;
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

  /**
   * Search providers by name
   */
  async search(query: string, limit = 20): Promise<Provider[]> {
    return this.prisma.provider.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get top providers by view count
   */
  async findTopProviders(limit = 10): Promise<Provider[]> {
    return this.prisma.provider.findMany({
      take: limit,
      orderBy: { viewCount: 'desc' },
    });
  }
}
