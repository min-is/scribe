/**
 * Provider Repository
 *
 * Data access layer for Provider model operations.
 * Encapsulates all database queries related to providers.
 */

import { Provider, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export type ProviderWithPage = Provider & {
  page: {
    id: string;
    slug: string;
    title: string;
    content: Prisma.JsonValue;
    textContent: string | null;
    icon: string | null;
    coverPhoto: string | null;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
  } | null;
};

export class ProviderRepository extends BaseRepository<Provider> {
  protected getDelegate() {
    return this.prisma.provider;
  }

  /**
   * Find provider by slug
   */
  async findBySlug(slug: string): Promise<Provider | null> {
    return this.prisma.provider.findUnique({
      where: { slug },
    });
  }

  /**
   * Find provider by slug with associated page
   */
  async findBySlugWithPage(slug: string): Promise<ProviderWithPage | null> {
    return this.prisma.provider.findUnique({
      where: { slug },
      include: {
        page: {
          select: {
            id: true,
            slug: true,
            title: true,
            content: true,
            textContent: true,
            icon: true,
            coverPhoto: true,
            viewCount: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  /**
   * Get all providers with optional ordering
   */
  async findAll(orderBy: 'name' | 'viewCount' | 'searchClickCount' = 'name'): Promise<Provider[]> {
    const orderByClause: Prisma.ProviderOrderByWithRelationInput =
      orderBy === 'name'
        ? { name: 'asc' }
        : orderBy === 'viewCount'
        ? { viewCount: 'desc' }
        : { searchClickCount: 'desc' };

    return this.prisma.provider.findMany({
      orderBy: orderByClause,
    });
  }

  /**
   * Get top providers by popularity
   */
  async findTopProviders(limit: number = 10): Promise<Provider[]> {
    return this.prisma.provider.findMany({
      orderBy: [
        { viewCount: 'desc' },
        { searchClickCount: 'desc' },
        { name: 'asc' },
      ],
      take: limit,
    });
  }

  /**
   * Increment provider view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.provider.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
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
        searchClickCount: { increment: 1 },
      },
    });
  }

  /**
   * Update provider with page content sync
   * This ensures Provider.wikiContent and Page.content stay in sync
   */
  async updateWithPageSync(
    id: string,
    providerData: Prisma.ProviderUpdateInput,
    pageContent?: Prisma.InputJsonValue,
    pageTextContent?: string
  ): Promise<Provider> {
    // Use a transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      // Update provider
      const provider = await tx.provider.update({
        where: { id },
        data: providerData,
      });

      // If page content is provided, update the associated page
      if (pageContent !== undefined && pageTextContent !== undefined) {
        const page = await tx.page.findFirst({
          where: { providerId: id },
        });

        if (page) {
          await tx.page.update({
            where: { id: page.id },
            data: {
              content: pageContent,
              textContent: pageTextContent,
              updatedAt: new Date(),
            },
          });
        }
      }

      return provider;
    });
  }

  /**
   * Search providers by name or credentials
   */
  async search(query: string): Promise<Provider[]> {
    return this.prisma.provider.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { credentials: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Get providers with difficulty metrics
   */
  async findWithDifficulty(): Promise<Provider[]> {
    return this.prisma.provider.findMany({
      where: {
        generalDifficulty: { not: null },
      },
      orderBy: {
        generalDifficulty: 'desc',
      },
    });
  }
}
