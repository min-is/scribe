import type { PrismaClient, Page } from '@prisma/client';
import type { JSONContent } from '@tiptap/core';
import { PageRepository } from '../repositories/page.repository';
import { tipTapToPlainText } from '../utils/content-transformers';
import { validateTipTapContent, parseTipTapContent } from '../utils/type-guards';
import { fromJsonValue } from '../utils/json-helpers';
import type {
  PageDTO,
  PageSummaryDTO,
  CreatePageInput,
  UpdatePageInput,
  PageSearchFilters,
} from '../dtos/page.dto';

export class PageService {
  private repository: PageRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new PageRepository(prisma);
  }

  private mapToDTO(page: Page): PageDTO {
    const content = fromJsonValue<JSONContent>(page.content) || {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    };

    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      content,
      textContent: page.textContent,
      type: page.type,
      parentId: page.parentId,
      position: page.position,
      icon: page.icon,
      coverPhoto: page.coverPhoto,
      category: page.category,
      tags: page.tags,
      deletedAt: page.deletedAt,
      viewCount: page.viewCount,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      createdBy: page.createdBy,
      updatedBy: page.updatedBy,
    };
  }

  private mapToSummaryDTO(page: Page): PageSummaryDTO {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      type: page.type,
      icon: page.icon,
      category: page.category,
      tags: page.tags,
      viewCount: page.viewCount,
      updatedAt: page.updatedAt,
    };
  }

  async getPageBySlug(slug: string, includeDeleted = false): Promise<PageDTO | null> {
    const page: Page | null = await this.repository.findBySlug(slug, includeDeleted);
    if (!page) return null;

    return this.mapToDTO(page);
  }

  async getPagesByType(type: PageDTO['type'], includeDeleted = false): Promise<PageSummaryDTO[]> {
    const pages: Page[] = await this.repository.findByType(type, includeDeleted);
    return pages.map((p) => this.mapToSummaryDTO(p));
  }

  async searchPages(filters: PageSearchFilters): Promise<PageSummaryDTO[]> {
    const pages: Page[] = await this.repository.findWithFilters(filters);
    return pages.map((p) => this.mapToSummaryDTO(p));
  }

  async createPage(input: CreatePageInput): Promise<PageDTO> {
    const content = input.content || {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    };

    const validation = validateTipTapContent(content);
    if (!validation.valid) {
      throw new Error(`Invalid content: ${validation.error}`);
    }

    const textContent = tipTapToPlainText(content);

    const page: Page = await this.repository.create({
      slug: input.slug,
      title: input.title,
      content,
      textContent,
      type: input.type,
      parentId: input.parentId,
      position: input.position,
      icon: input.icon,
      coverPhoto: input.coverPhoto,
      category: input.category,
      tags: input.tags,
      createdBy: input.createdBy,
    });

    return this.mapToDTO(page);
  }

  async updatePageContent(id: string, content: JSONContent, updatedBy?: string): Promise<PageDTO> {
    const validation = validateTipTapContent(content);
    if (!validation.valid) {
      throw new Error(`Invalid content: ${validation.error}`);
    }

    const textContent = tipTapToPlainText(content);

    const page: Page = await this.repository.updateContent(id, content, textContent);

    if (updatedBy) {
      await this.repository.update(id, { updatedBy });
    }

    return this.mapToDTO(page);
  }

  async updatePage(id: string, input: UpdatePageInput): Promise<PageDTO> {
    let textContent: string | undefined;

    if (input.content) {
      const validation = validateTipTapContent(input.content);
      if (!validation.valid) {
        throw new Error(`Invalid content: ${validation.error}`);
      }
      textContent = tipTapToPlainText(input.content);
    }

    const page: Page = await this.repository.update(id, {
      ...input,
      textContent,
    });

    return this.mapToDTO(page);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.repository.incrementViewCount(id);
  }

  async softDeletePage(id: string): Promise<PageDTO> {
    const page: Page = await this.repository.softDelete(id);
    return this.mapToDTO(page);
  }

  async restorePage(id: string): Promise<PageDTO> {
    const page: Page = await this.repository.restore(id);
    return this.mapToDTO(page);
  }

  async getRecentPages(limit: number, includeDeleted = false): Promise<PageSummaryDTO[]> {
    const pages: Page[] = await this.repository.findRecent(limit, includeDeleted);
    return pages.map((p) => this.mapToSummaryDTO(p));
  }

  async getPopularPages(limit: number, includeDeleted = false): Promise<PageSummaryDTO[]> {
    const pages: Page[] = await this.repository.findPopular(limit, includeDeleted);
    return pages.map((p) => this.mapToSummaryDTO(p));
  }
}
