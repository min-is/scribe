/**
 * Page Repository
 *
 * Data access layer for Page model operations.
 * Encapsulates all Prisma queries related to pages.
 */

import { PrismaClient, Page, PageType, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { CreatePageInput, UpdatePageInput, PageSearchFilters } from '../dtos/page.dto';

export class PageRepository extends BaseRepository<Page> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Find a page by ID
   */
  async findById(id: string, includeDeleted = false): Promise<Page | null> {
    const page: Page | null = await this.prisma.page.findUnique({
      where: { id },
    });

    if (!page) return null;

    if (!includeDeleted && page.deletedAt) {
      return null;
    }

    return page;
  }

  /**
   * Find a page by slug
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
   * Find all pages
   */
  async findAll(): Promise<Page[]> {
    return this.prisma.page.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
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
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Find pages with filters
   */
  async findWithFilters(filters: PageSearchFilters): Promise<Page[]> {
    const where: Prisma.PageWhereInput = {
      deletedAt: filters.includeDeleted ? undefined : null,
    };

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

    if (filters.query) {
      where.OR = [
        { title: { contains: filters.query, mode: 'insensitive' } },
        { textContent: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    return this.prisma.page.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: filters.limit,
      skip: filters.offset,
    });
  }

  /**
   * Create a new page
   */
  async create(data: CreatePageInput): Promise<Page> {
    return this.prisma.page.create({
      data: {
        slug: data.slug,
        title: data.title,
        content: data.content || { type: 'doc', content: [] },
        type: data.type,
        parentId: data.parentId,
        position: data.position || 'a0',
        icon: data.icon,
        coverPhoto: data.coverPhoto,
        category: data.category,
        tags: data.tags || [],
        createdBy: data.createdBy,
        providerId: data.providerId,
        procedureId: data.procedureId,
        scenarioId: data.scenarioId,
        smartPhraseId: data.smartPhraseId,
      },
    });
  }

  /**
   * Update an existing page
   */
  async update(id: string, data: UpdatePageInput): Promise<Page> {
    return this.prisma.page.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        parentId: data.parentId,
        position: data.position,
        icon: data.icon,
        coverPhoto: data.coverPhoto,
        category: data.category,
        tags: data.tags,
        updatedBy: data.updatedBy,
      },
    });
  }

  /**
   * Update page content
   */
  async updateContent(id: string, content: Prisma.InputJsonValue, textContent?: string): Promise<Page> {
    return this.prisma.page.update({
      where: { id },
      data: {
        content,
        textContent,
      },
    });
  }

  /**
   * Soft delete a page
   */
  async delete(id: string): Promise<void> {
    await this.prisma.page.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Permanently delete a page
   */
  async hardDelete(id: string): Promise<void> {
    await this.prisma.page.delete({
      where: { id },
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
   * Find pages with hierarchy (parent-child relationships)
   */
  async findWithHierarchy(parentId: string | null = null): Promise<Page[]> {
    return this.prisma.page.findMany({
      where: {
        parentId,
        deletedAt: null,
      },
      orderBy: { position: 'asc' },
    });
  }

  /**
   * Get breadcrumbs for a page (all ancestors)
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
}
