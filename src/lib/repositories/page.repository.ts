/**
 * Page Repository
 *
 * Data access layer for Page operations.
 */

import { PrismaClient, Page, PageType } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { PageSearchFilters } from '../dtos/page.dto';
import { JSONContent } from '@tiptap/core';
import { Prisma } from '@prisma/client';

export class PageRepository extends BaseRepository<Page> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected getModel() {
    return this.prisma.page;
  }

  /**
   * Find a page by slug
   */
  async findBySlug(
    slug: string,
    includeDeleted = false
  ): Promise<Page | null> {
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
    return await this.prisma.page.findMany({
      where: {
        type,
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Find pages with filters
   */
  async findWithFilters(filters: PageSearchFilters): Promise<Page[]> {
    const where: any = {};

    if (filters.type) {
      where.type = filters.type;
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

    if (!filters.includeDeleted) {
      where.deletedAt = null;
    }

    return await this.prisma.page.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Update page content
   */
  async updateContent(
    id: string,
    content: JSONContent,
    textContent: string
  ): Promise<Page> {
    return await this.prisma.page.update({
      where: { id },
      data: {
        content: content as Prisma.InputJsonValue,
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
      data: { viewCount: { increment: 1 } },
    });
  }

  /**
   * Find page with hierarchy (parent and children)
   */
  async findWithHierarchy(id: string): Promise<Page | null> {
    return await this.prisma.page.findUnique({
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
   * Get breadcrumbs for a page
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
   * Find recent pages
   */
  async findRecent(limit: number, includeDeleted = false): Promise<Page[]> {
    return await this.prisma.page.findMany({
      where: {
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Find popular pages by view count
   */
  async findPopular(limit: number, includeDeleted = false): Promise<Page[]> {
    return await this.prisma.page.findMany({
      where: {
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });
  }

  /**
   * Soft delete a page
   */
  async softDelete(id: string): Promise<Page> {
    return await this.prisma.page.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restore a soft-deleted page
   */
  async restore(id: string): Promise<Page> {
    return await this.prisma.page.update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}
