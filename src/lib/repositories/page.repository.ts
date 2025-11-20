/**
 * Page Repository
 *
 * Data access layer for Page entities.
 * Encapsulates all Prisma queries related to pages.
 */

import { Page, PageType, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { CreatePageInput, UpdatePageInput, PageSearchFilters } from '../dtos';
import { JSONContent } from '@tiptap/core';
import { generateJitteredKeyBetween } from 'fractional-indexing-jittered';
import { toInputJsonValue } from '../utils/json-helpers';

export class PageRepository extends BaseRepository<Page, CreatePageInput, UpdatePageInput> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Find a page by ID
   */
  async findById(id: string): Promise<Page | null> {
    return this.prisma.page.findUnique({
      where: { id },
    });
  }

  /**
   * Find a page by slug
   */
  async findBySlug(slug: string, includeDeleted = false): Promise<Page | null> {
    const page = await this.prisma.page.findUnique({
      where: { slug },
    });

    if (!page) return null;
    if (!includeDeleted && page.deletedAt) return null;

    return page;
  }

  /**
   * Find multiple pages with optional filters
   */
  async findMany(filters?: PageSearchFilters): Promise<Page[]> {
    return this.prisma.page.findMany({
      where: {
        type: filters?.type,
        category: filters?.category,
        tags: filters?.tags ? { hasSome: filters.tags } : undefined,
        parentId: filters?.parentId,
        deletedAt: filters?.includeDeleted ? undefined : null,
      },
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
      orderBy: { position: 'asc' },
    });
  }

  /**
   * Create a new page
   */
  async create(data: CreatePageInput): Promise<Page> {
    const position = generateJitteredKeyBetween(null, null);

    return this.prisma.page.create({
      data: {
        slug: data.slug,
        title: data.title,
        content: data.content ? toInputJsonValue(data.content) : toInputJsonValue({ type: 'doc', content: [] }),
        textContent: data.textContent || data.title,
        type: data.type,
        parentId: data.parentId,
        position,
        icon: data.icon,
        coverPhoto: data.coverPhoto,
        category: data.category,
        tags: data.tags || [],
        createdBy: data.createdBy,
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
        slug: data.slug,
        title: data.title,
        content: data.content ? toInputJsonValue(data.content) : undefined,
        textContent: data.textContent,
        parentId: data.parentId,
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
  async updateContent(id: string, content: JSONContent, textContent?: string): Promise<Page> {
    return this.prisma.page.update({
      where: { id },
      data: {
        content: toInputJsonValue(content),
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
   * Find pages with hierarchy (parent and children)
   */
  async findWithHierarchy(id: string): Promise<Page & { parent: Page | null; children: Page[] } | null> {
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
   * Get breadcrumbs for a page (all ancestors)
   */
  async getBreadcrumbs(id: string): Promise<Page[]> {
    const breadcrumbs: Page[] = [];
    let currentId: string | null = id;

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
  async findRecent(limit = 10, type?: PageType): Promise<Page[]> {
    return this.prisma.page.findMany({
      where: {
        type,
        deletedAt: null,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Find popular pages by view count
   */
  async findPopular(limit = 10, type?: PageType): Promise<Page[]> {
    return this.prisma.page.findMany({
      where: {
        type,
        deletedAt: null,
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });
  }
}
