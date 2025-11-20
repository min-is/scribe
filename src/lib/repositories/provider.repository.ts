import { PrismaClient, Provider, Page, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export interface ProviderWithPage extends Provider {
  page?: Page | null;
}

/**
 * Provider Repository
 *
 * Handles all database operations for Providers.
 * Key responsibility: Maintains sync between Provider and Page models
 */
export class ProviderRepository extends BaseRepository<Provider> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected getDelegate() {
    return this.prisma.provider;
  }

  /**
   * Find provider by slug with associated page
   */
  async findBySlugWithPage(slug: string): Promise<ProviderWithPage | null> {
    return await this.prisma.provider.findUnique({
      where: { slug },
      include: {
        page: true,
      },
    });
  }

  /**
   * Update provider and sync with page
   * Uses transaction to ensure both update atomically
   */
  async updateWithPageSync(
    id: string,
    providerData: Prisma.ProviderUpdateInput,
    pageData?: Prisma.PageUpdateInput
  ): Promise<Provider> {
    return await this.prisma.$transaction(async (tx) => {
      // Update provider
      const provider = await tx.provider.update({
        where: { id },
        data: providerData,
        include: {
          page: true,
        },
      });

      // Update associated page if data provided
      if (pageData && provider.page) {
        await tx.page.update({
          where: { id: provider.page.id },
          data: pageData,
        });
      }

      return provider;
    });
  }

  /**
   * Create provider with associated page
   */
  async createWithPage(
    providerData: Prisma.ProviderCreateInput,
    pageData: Prisma.PageCreateInput
  ): Promise<Provider> {
    return await this.prisma.provider.create({
      data: {
        ...providerData,
        page: {
          create: pageData,
        },
      },
      include: {
        page: true,
      },
    });
  }

  /**
   * Search providers
   */
  async search(query: string, limit = 20): Promise<Provider[]> {
    return await this.prisma.provider.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { slug: { contains: query, mode: 'insensitive' } },
          { credentials: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Find top providers by view count
   */
  async findTopProviders(limit = 10): Promise<Provider[]> {
    return await this.prisma.provider.findMany({
      orderBy: {
        viewCount: 'desc',
      },
      take: limit,
      include: {
        page: true,
      },
    });
  }

  /**
   * Increment provider view count
   * Also increments associated page view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const provider = await tx.provider.update({
        where: { id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
        include: {
          page: true,
        },
      });

      // Also increment page view count if exists
      if (provider.page) {
        await tx.page.update({
          where: { id: provider.page.id },
          data: {
            viewCount: {
              increment: 1,
            },
          },
        });
      }
    });
  }

  /**
   * Find all providers
   */
  async findAll(): Promise<Provider[]> {
    return await this.prisma.provider.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Find providers by difficulty range
   */
  async findByDifficultyRange(
    min: number,
    max: number
  ): Promise<Provider[]> {
    return await this.prisma.provider.findMany({
      where: {
        generalDifficulty: {
          gte: min,
          lte: max,
        },
      },
      orderBy: {
        generalDifficulty: 'asc',
      },
    });
  }
}
