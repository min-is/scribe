import type { PrismaClient, Page, PageType } from '@prisma/client';
import type { JSONContent } from '@tiptap/core';
import { BaseRepository } from './base.repository';
import { toInputJsonValue } from '../utils/json-helpers';
import type { PageSearchFilters } from '../dtos/page.dto';

export class PageRepository extends BaseRepository<Page> {
  protected getModel() {
    return this.prisma.page;
  }

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

    if (filters.searchQuery) {
      where.OR = [
        { title: { contains: filters.searchQuery, mode: 'insensitive' } },
        { textContent: { contains: filters.searchQuery, mode: 'insensitive' } },
      ];
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

  async create(data: {
    slug: string;
    title: string;
    content: JSONContent;
    textContent?: string;
    type: PageType;
    parentId?: string;
    position?: string;
    icon?: string;
    coverPhoto?: string;
    category?: string;
    tags?: string[];
    createdBy?: string;
  }): Promise<Page> {
    const page: Page = await this.prisma.page.create({
      data: {
        slug: data.slug,
        title: data.title,
        content: toInputJsonValue(data.content),
        textContent: data.textContent || null,
        type: data.type,
        parentId: data.parentId || null,
        position: data.position || 'a0',
        icon: data.icon || null,
        coverPhoto: data.coverPhoto || null,
        category: data.category || null,
        tags: data.tags || [],
        createdBy: data.createdBy || null,
      },
    });

    return page;
  }

  async updateContent(id: string, content: JSONContent, textContent?: string): Promise<Page> {
    const page: Page = await this.prisma.page.update({
      where: { id },
      data: {
        content: toInputJsonValue(content),
        textContent: textContent || null,
      },
    });

    return page;
  }

  async update(
    id: string,
    data: {
      title?: string;
      content?: JSONContent;
      textContent?: string;
      icon?: string;
      coverPhoto?: string;
      category?: string;
      tags?: string[];
      parentId?: string;
      position?: string;
      updatedBy?: string;
    }
  ): Promise<Page> {
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = toInputJsonValue(data.content);
    if (data.textContent !== undefined) updateData.textContent = data.textContent;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.coverPhoto !== undefined) updateData.coverPhoto = data.coverPhoto;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy;

    const page: Page = await this.prisma.page.update({
      where: { id },
      data: updateData,
    });

    return page;
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.page.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async softDelete(id: string): Promise<Page> {
    const page: Page = await this.prisma.page.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return page;
  }

  async restore(id: string): Promise<Page> {
    const page: Page = await this.prisma.page.update({
      where: { id },
      data: { deletedAt: null },
    });

    return page;
  }

  async findRecent(limit: number, includeDeleted = false): Promise<Page[]> {
    const pages: Page[] = await this.prisma.page.findMany({
      where: {
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return pages;
  }

  async findPopular(limit: number, includeDeleted = false): Promise<Page[]> {
    const pages: Page[] = await this.prisma.page.findMany({
      where: {
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });

    return pages;
  }
}
