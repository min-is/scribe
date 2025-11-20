/**
 * Page Repository
 *
 * Data access layer for Page model.
 * Encapsulates all Prisma queries for Pages.
 */

import type { PrismaClient, Page, PageType } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class PageRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
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
    return this.prisma.page.findMany({
      where: {
        type,
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findWithFilters(filters: {
    type?: PageType;
    includeDeleted?: boolean;
    parentId?: string | null;
  }): Promise<Page[]> {
    return this.prisma.page.findMany({
      where: {
        type: filters.type,
        parentId: filters.parentId,
        deletedAt: filters.includeDeleted ? undefined : null,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(data: {
    slug: string;
    title: string;
    content: any;
    textContent?: string;
    type: PageType;
    icon?: string;
    coverPhoto?: string;
    parentId?: string;
    providerId?: string;
    procedureId?: string;
    scenarioId?: string;
    smartPhraseId?: string;
  }): Promise<Page> {
    return this.prisma.page.create({
      data,
    });
  }

  async updateContent(
    id: string,
    content: any,
    textContent?: string
  ): Promise<Page> {
    return this.prisma.page.update({
      where: { id },
      data: {
        content,
        textContent,
        updatedAt: new Date(),
      },
    });
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.page.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });
  }

  async softDelete(id: string): Promise<Page> {
    return this.prisma.page.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async findRecent(limit = 10, includeDeleted = false): Promise<Page[]> {
    return this.prisma.page.findMany({
      where: {
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }

  async findPopular(limit = 10, includeDeleted = false): Promise<Page[]> {
    return this.prisma.page.findMany({
      where: {
        deletedAt: includeDeleted ? undefined : null,
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
    });
  }
}
