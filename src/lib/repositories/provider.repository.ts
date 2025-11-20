/**
 * Provider Repository
 *
 * Data access layer for Provider model
 */

import { Provider, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { toInputJsonValue } from '../utils/json-helpers';
import { WikiContent } from '@/provider/wiki-schema';

export type ProviderWithPage = Provider & {
  page: any | null;
};

export class ProviderRepository extends BaseRepository<Provider> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected getModel() {
    return this.prisma.provider;
  }

  /**
   * Find provider by slug
   */
  async findBySlug(slug: string, includeDeleted = false): Promise<Provider | null> {
    const provider: Provider | null = await this.prisma.provider.findUnique({
      where: { slug },
    });

    if (!provider) return null;

    if (!includeDeleted && provider.deletedAt) {
      return null;
    }

    return provider;
  }

  /**
   * Find provider by slug with associated page
   */
  async findBySlugWithPage(slug: string): Promise<ProviderWithPage | null> {
    const provider: ProviderWithPage | null = await this.prisma.provider.findUnique({
      where: { slug },
      include: { page: true },
    });

    if (!provider || provider.deletedAt) {
      return null;
    }

    return provider;
  }

  /**
   * Update provider and sync with page
   * This ensures Provider and Page remain in sync
   */
  async updateWithPageSync(
    id: string,
    data: {
      name?: string;
      credentials?: string;
      generalDifficulty?: number;
      wikiContent?: WikiContent;
      noteTemplate?: string;
      noteSmartPhrase?: string;
      preferences?: unknown;
    }
  ): Promise<Provider> {
    // Convert WikiContent to InputJsonValue if present
    const updateData: any = {
      ...data,
      wikiContent: data.wikiContent ? toInputJsonValue(data.wikiContent) : undefined,
      preferences: data.preferences ? toInputJsonValue(data.preferences) : undefined,
    };

    const provider: Provider = await this.prisma.provider.update({
      where: { id },
      data: updateData,
    });

    return provider;
  }

  /**
   * Find top providers by view count
   */
  async findTopProviders(limit = 10): Promise<Provider[]> {
    const providers: Provider[] = await this.prisma.provider.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });

    return providers;
  }

  /**
   * Search providers
   */
  async search(query: string, limit = 20): Promise<Provider[]> {
    const providers: Provider[] = await this.prisma.provider.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { credentials: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return providers;
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.provider.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Increment search click count
   */
  async incrementSearchClickCount(id: string): Promise<void> {
    await this.prisma.provider.update({
      where: { id },
      data: {
        searchClickCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Find all providers
   */
  async findAll(includeDeleted = false): Promise<Provider[]> {
    const providers: Provider[] = await this.prisma.provider.findMany({
      where: {
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { name: 'asc' },
    });

    return providers;
  }
}
