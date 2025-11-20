/**
 * Page Repository
 *
 * Data access layer for Page model operations.
 * Encapsulates all database queries related to pages.
 */

import { Page, PageType, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PageSearchFilters } from '../dtos/page.dto';

export class PageRepository extends BaseRepository<Page> {
  protected getDelegate() {
    return this.prisma.page;
  }

  /**
   * Find a page by slug (excluding soft-deleted by default)
   */
  async findBySlug(slug: string, includeDeleted = false): Promise<Page | null> {
    return this.prisma.page.findFirst({
      where: {
        slug,
        deletedAt: includeDeleted ? undefined : null,
      },
    });
  }

  /**
   * Find pages by type
   */
  async findByType(type: PageType, includeDeleted = false): Promise<Page[]> {
    return this.prisma.page.findMany({
      where: {
        type,
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: {
        position: 'asc',
      },
    });
  }

  /**
   * Find pages with filters
   */
  async findWithFilters(filters: PageSearchFilters): Promise<Page[]> {
    const where: Prisma.PageWhereInput = {
      deletedAt: filters.includeDeleted ? undefined : null,
    };

    if (filters.type && filters.type.length > 0) {
      where.type = { in: filters.type };
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters.parentId !== undefined) {
      where.parentId = filters.parentId;
    }

    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { textContent: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    return this.prisma.page.findMany({
      where,
      orderBy: {
        position: 'asc',
      },
    });
  }

  /**
   * Update page content
   */
  async updateContent(id: string, content: Prisma.InputJsonValue, textContent: string): Promise<Page> {
    return this.prisma.page.update({
      where: { id },
      data: {
        content,
        textContent,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.page.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  /**
   * Soft delete a page
   */
  async softDelete(id: string): Promise<Page> {
    return this.prisma.page.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Restore a soft-deleted page
   */
  async restore(id: string): Promise<Page> {
    return this.prisma.page.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  /**
   * Find page with parent and children
   */
  async findWithHierarchy(id: string): Promise<Page & {
    parent: Page | null;
    children: Page[];
  } | null> {
    return this.prisma.page.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: { deletedAt: null },
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  /**
   * Get breadcrumb trail for a page
   */
  async getBreadcrumbs(id: string): Promise<Page[]> {
    const breadcrumbs: Page[] = [];
    let currentId: string | null = id;

    while (currentId) {
      const page = await this.prisma.page.findUnique({
        where: { id: currentId },
      });

      if (!page) break;

      breadcrumbs.unshift(page);
      currentId = page.parentId;
    }

    return breadcrumbs;
  }

  /**
   * Find pages by provider ID
   */
  async findByProviderId(providerId: string): Promise<Page | null> {
    return this.prisma.page.findFirst({
      where: {
        providerId,
        deletedAt: null,
      },
    });
  }

  /**
   * Get recent pages
   */
  async findRecent(limit: number = 10, type?: PageType): Promise<Page[]> {
    return this.prisma.page.findMany({
      where: {
        type,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get popular pages
   */
  async findPopular(limit: number = 10, type?: PageType): Promise<Page[]> {
    return this.prisma.page.findMany({
      where: {
        type,
        deletedAt: null,
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: limit,
    });
  }
}
