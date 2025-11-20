/**
 * Page Service
 *
 * Business logic for Page operations.
 * Handles validation, transformation, and coordination.
 */

import type { PrismaClient } from '@prisma/client';
import type { JSONContent } from '@tiptap/core';
import { PageRepository } from '../repositories/page.repository';
import { validateTipTapContent } from '../utils/type-guards';
import { tipTapToPlainText } from '../utils/content-transformers';
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

  /**
   * Get a page by slug.
   */
  async getPageBySlug(slug: string, includeDeleted = false): Promise<PageDTO | null> {
    const page = await this.repository.findBySlug(slug, includeDeleted);
    if (!page) return null;

    return this.toDTO(page);
  }

  /**
   * Create a new page.
   */
  async createPage(input: CreatePageInput): Promise<PageDTO> {
    // Validate content if provided
    if (input.content) {
      const validation = validateTipTapContent(input.content);
      if (!validation.valid) {
        throw new Error(`Invalid content: ${validation.error}`);
      }
    }

    const content = input.content || {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    };

    const textContent = tipTapToPlainText(content);

    const page = await this.repository.create({
      slug: input.slug,
      title: input.title,
      content,
      textContent,
      type: input.type,
      icon: input.icon,
      coverPhoto: input.coverPhoto,
      parentId: input.parentId,
      providerId: input.providerId,
      procedureId: input.procedureId,
      scenarioId: input.scenarioId,
      smartPhraseId: input.smartPhraseId,
    });

    return this.toDTO(page);
  }

  /**
   * Update page content.
   */
  async updatePageContent(id: string, content: JSONContent): Promise<PageDTO> {
    const validation = validateTipTapContent(content);
    if (!validation.valid) {
      throw new Error(`Invalid content: ${validation.error}`);
    }

    const textContent = tipTapToPlainText(content);
    const page = await this.repository.updateContent(id, content, textContent);

    return this.toDTO(page);
  }

  /**
   * Search pages with filters.
   */
  async searchPages(filters: PageSearchFilters): Promise<PageSummaryDTO[]> {
    const pages = await this.repository.findWithFilters(filters);
    return pages.map(this.toSummaryDTO);
  }

  /**
   * Increment view count.
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.repository.incrementViewCount(id);
  }

  /**
   * Soft delete a page.
   */
  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  /**
   * Convert Prisma Page model to PageDTO.
   */
  private toDTO(page: any): PageDTO {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      content: page.content as JSONContent,
      textContent: page.textContent,
      type: page.type,
      icon: page.icon,
      coverPhoto: page.coverPhoto,
      viewCount: page.viewCount,
      deletedAt: page.deletedAt,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }

  /**
   * Convert Prisma Page model to PageSummaryDTO.
   */
  private toSummaryDTO(page: any): PageSummaryDTO {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      type: page.type,
      icon: page.icon,
      updatedAt: page.updatedAt,
    };
  }
}
