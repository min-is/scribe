import { PrismaClient, Page, PageType, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export interface PageWithRelations extends Page {
  parent?: Page | null;
  children?: Page[];
}

export interface PageSearchOptions {
  query?: string;
  type?: PageType;
  category?: string;
  tags?: string[];
  includeDeleted?: boolean;
  parentId?: string | null;
  limit?: number;
  offset?: number;
}

/**
 * Page Repository
 *
 * Handles all database operations for Pages.
 * Provides methods for:
 * - CRUD operations
 * - Hierarchical queries (parent/child relationships)
 * - Search and filtering
 * - Soft delete support
 */
export class PageRepository extends BaseRepository<Page> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  protected getDelegate() {
    return this.prisma.page;
  }

  /**
   * Find a page by slug
   * @param slug - The page slug
   * @param includeDeleted - Whether to include soft-deleted pages
   */
  async findBySlug(
    slug: string,
    includeDeleted = false
  ): Promise<Page | null> {
    return await this.prisma.page.findFirst({
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
    return await this.prisma.page.findMany({
      where: {
        type,
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Find a page with its full hierarchy (parent and children)
   */
  async findWithHierarchy(id: string): Promise<PageWithRelations | null> {
    return await this.prisma.page.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });
  }

  /**
   * Get breadcrumb trail for a page
   * Returns array of pages from root to current page
   */
  async getBreadcrumbs(pageId: string): Promise<Page[]> {
    const breadcrumbs: Page[] = [];
    let currentId: string | null = pageId;

    while (currentId) {
      // FIXED: Add explicit type annotation to avoid circular reference error
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
   * Search pages with filters
   */
  async findWithFilters(options: PageSearchOptions): Promise<Page[]> {
    const {
      query,
      type,
      category,
      tags,
      includeDeleted = false,
      parentId,
      limit = 50,
      offset = 0,
    } = options;

    const where: Prisma.PageWhereInput = {
      deletedAt: includeDeleted ? undefined : null,
    };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { textContent: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
      ];
    }

    return await this.prisma.page.findMany({
      where,
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Update page content
   */
  async updateContent(
    id: string,
    content: any,
    textContent?: string
  ): Promise<Page> {
    return await this.prisma.page.update({
      where: { id },
      data: {
        content,
        textContent,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Soft delete a page
   */
  async softDelete(id: string): Promise<Page> {
    return await this.prisma.page.update({
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
    return await this.prisma.page.update({
      where: { id },
      data: {
        deletedAt: null,
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
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Find recent pages
   */
  async findRecent(limit = 10, type?: PageType): Promise<Page[]> {
    return await this.prisma.page.findMany({
      where: {
        deletedAt: null,
        type,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Find popular pages
   */
  async findPopular(limit = 10, type?: PageType): Promise<Page[]> {
    return await this.prisma.page.findMany({
      where: {
        deletedAt: null,
        type,
      },
      orderBy: {
        viewCount: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Find pages by category
   */
  async findByCategory(category: string): Promise<Page[]> {
    return await this.prisma.page.findMany({
      where: {
        category,
        deletedAt: null,
      },
      orderBy: {
        title: 'asc',
      },
    });
  }

  /**
   * Find child pages
   */
  async findChildren(parentId: string): Promise<Page[]> {
    return await this.prisma.page.findMany({
      where: {
        parentId,
        deletedAt: null,
      },
      orderBy: {
        position: 'asc',
      },
    });
  }
}
