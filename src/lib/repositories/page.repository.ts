/**
 * Page Repository
 * Data access layer for Page model
 */

import { PrismaClient, Page, PageType } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { CreatePageInput, UpdatePageInput, PageSearchFilters } from '../dtos';
import { toInputJsonValue } from '../utils/json-helpers';

export class PageRepository extends BaseRepository<Page> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Find a page by ID
   */
  async findById(id: string): Promise<Page | null> {
    const page: Page | null = await this.prisma.page.findUnique({
      where: { id },
    });
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

    // Check soft delete
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
    const where: Record<string, unknown> = {};

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

    const pages: Page[] = await this.prisma.page.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });
    return pages;
  }

  /**
   * Find multiple pages
   */
  async findMany(): Promise<Page[]> {
    const pages: Page[] = await this.prisma.page.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
    return pages;
  }

  /**
   * Create a new page
   */
  async create(input: CreatePageInput): Promise<Page> {
    const page: Page = await this.prisma.page.create({
      data: {
        slug: input.slug,
        title: input.title,
        content: input.content ? toInputJsonValue(input.content) : { type: 'doc', content: [] },
        type: input.type,
        parentId: input.parentId || null,
        icon: input.icon || null,
        coverPhoto: input.coverPhoto || null,
        category: input.category || null,
        tags: input.tags || [],
        createdBy: input.createdBy || null,
      },
    });
    return page;
  }

  /**
   * Update a page
   */
  async update(id: string, input: UpdatePageInput): Promise<Page> {
    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.content !== undefined) updateData.content = toInputJsonValue(input.content);
    if (input.icon !== undefined) updateData.icon = input.icon;
    if (input.coverPhoto !== undefined) updateData.coverPhoto = input.coverPhoto;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.parentId !== undefined) updateData.parentId = input.parentId;
    if (input.position !== undefined) updateData.position = input.position;
    if (input.updatedBy !== undefined) updateData.updatedBy = input.updatedBy;

    const page: Page = await this.prisma.page.update({
      where: { id },
      data: updateData,
    });
    return page;
  }

  /**
   * Update page content
   */
  async updateContent(id: string, content: unknown, textContent?: string): Promise<Page> {
    const page: Page = await this.prisma.page.update({
      where: { id },
      data: {
        content: toInputJsonValue(content),
        textContent: textContent || null,
      },
    });
    return page;
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
  async findRecent(limit = 10): Promise<Page[]> {
    const pages: Page[] = await this.prisma.page.findMany({
      where: { deletedAt: null },
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
      where: { deletedAt: null },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });
    return pages;
  }
}
