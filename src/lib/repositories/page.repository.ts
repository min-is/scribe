/**
 * Page Repository
 *
 * Data access layer for Page model
 */

import { Page, PageType, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PageSearchFilters } from '../dtos';

export class PageRepository extends BaseRepository<Page> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected getModel() {
    return this.prisma.page;
  }

  /**
   * Find page by slug
   */
  async findBySlug(slug: string, includeDeleted = false): Promise<Page | null> {
    const page: Page | null = await this.prisma.page.findUnique({
      where: { slug },
    });

    if (!page) return null;

    if (!includeDeleted && page.deletedAt) {
      return null;
    }

    return page;
  }

  /**
   * Find pages by type
   */
  async findByType(type: PageType, includeDeleted = false): Promise<Page[]> {
    const pages: Page[] = await this.prisma.page.findMany({
      where: {
        type,
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return pages;
  }

  /**
   * Find pages with filters
   */
  async findWithFilters(filters: PageSearchFilters): Promise<Page[]> {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.parentId) {
      where.parentId = filters.parentId;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    if (filters.searchQuery) {
      where.OR = [
        { title: { contains: filters.searchQuery, mode: 'insensitive' } },
        { textContent: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
    }

    const pages: Page[] = await this.prisma.page.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    return pages;
  }

  /**
   * Update page content
   */
  async updateContent(id: string, content: any, textContent?: string): Promise<Page> {
    const page: Page = await this.prisma.page.update({
      where: { id },
      data: {
        content,
        textContent,
        updatedAt: new Date(),
      },
    });

    return page;
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.page.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Get page hierarchy (breadcrumbs)
   */
  async getBreadcrumbs(pageId: string): Promise<Page[]> {
    const breadcrumbs: Page[] = [];
    let currentId: string | null = pageId;

    while (currentId) {
      const page: Page | null = await this.prisma.page.findUnique({
        where: { id: currentId },
      });

      if (!page) break;

      breadcrumbs.unshift(page);
      currentId = page.parentId;
    }

    return breadcrumbs;
  }

  /**
   * Find child pages
   */
  async findChildren(parentId: string, includeDeleted = false): Promise<Page[]> {
    const pages: Page[] = await this.prisma.page.findMany({
      where: {
        parentId,
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { title: 'asc' },
    });

    return pages;
  }

  /**
   * Find recent pages
   */
  async findRecent(limit = 10): Promise<Page[]> {
    const pages: Page[] = await this.prisma.page.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return pages;
  }

  /**
   * Find popular pages
   */
  async findPopular(limit = 10): Promise<Page[]> {
    const pages: Page[] = await this.prisma.page.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });

    return pages;
  }

  /**
   * Find page by provider ID
   */
  async findByProviderId(providerId: string): Promise<Page | null> {
    const page: Page | null = await this.prisma.page.findFirst({
      where: {
        providerId,
        deletedAt: null,
      },
    });

    return page;
  }

  /**
   * Find page by procedure ID
   */
  async findByProcedureId(procedureId: string): Promise<Page | null> {
    const page: Page | null = await this.prisma.page.findFirst({
      where: {
        procedureId,
        deletedAt: null,
      },
    });

    return page;
  }
}
