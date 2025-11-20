/**
 * Page Service
 * Business logic for page operations
 */

import { PrismaClient, Page } from '@prisma/client';
import { JSONContent } from '@tiptap/core';
import { PageRepository } from '../repositories';
import {
  PageDTO,
  PageSummaryDTO,
  CreatePageInput,
  UpdatePageInput,
  PageSearchFilters,
} from '../dtos';
import { tipTapToPlainText } from '../utils/content-transformers';
import { validateTipTapContent, parseTipTapContent } from '../utils/type-guards';
import { fromJsonValue } from '../utils/json-helpers';

export class PageService {
  private repository: PageRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new PageRepository(prisma);
  }

  /**
   * Convert Prisma Page to PageDTO
   */
  private toDTO(page: Page): PageDTO {
    const content = parseTipTapContent(page.content) || { type: 'doc', content: [] };

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

  /**
   * Convert Prisma Page to PageSummaryDTO
   */
  private toSummaryDTO(page: Page): PageSummaryDTO {
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

  /**
   * Get a page by slug
   */
  async getPageBySlug(slug: string, includeDeleted = false): Promise<PageDTO | null> {
    const page: Page | null = await this.repository.findBySlug(slug, includeDeleted);
    return page ? this.toDTO(page) : null;
  }

  /**
   * Get a page by ID
   */
  async getPageById(id: string): Promise<PageDTO | null> {
    const page: Page | null = await this.repository.findById(id);
    return page ? this.toDTO(page) : null;
  }

  /**
   * Get pages by type
   */
  async getPagesByType(type: string, includeDeleted = false): Promise<PageSummaryDTO[]> {
    const pages: Page[] = await this.repository.findByType(type as any, includeDeleted);
    return pages.map((p) => this.toSummaryDTO(p));
  }

  /**
   * Search pages with filters
   */
  async searchPages(filters: PageSearchFilters): Promise<PageSummaryDTO[]> {
    const pages: Page[] = await this.repository.findWithFilters(filters);
    return pages.map((p) => this.toSummaryDTO(p));
  }

  /**
   * Create a new page
   */
  async createPage(input: CreatePageInput): Promise<PageDTO> {
    // Validate content if provided
    if (input.content) {
      const validation = validateTipTapContent(input.content);
      if (!validation.valid) {
        throw new Error(`Invalid content: ${validation.error}`);
      }
    }

    const page: Page = await this.repository.create(input);
    return this.toDTO(page);
  }

  /**
   * Update a page
   */
  async updatePage(id: string, input: UpdatePageInput): Promise<PageDTO> {
    // Validate content if provided
    if (input.content) {
      const validation = validateTipTapContent(input.content);
      if (!validation.valid) {
        throw new Error(`Invalid content: ${validation.error}`);
      }
    }

    const page: Page = await this.repository.update(id, input);
    return this.toDTO(page);
  }

  /**
   * Update page content with automatic text extraction
   */
  async updatePageContent(id: string, content: JSONContent): Promise<PageDTO> {
    // Validate content
    const validation = validateTipTapContent(content);
    if (!validation.valid) {
      throw new Error(`Invalid content: ${validation.error}`);
    }

    // Extract plain text for search
    const textContent: string = tipTapToPlainText(content);

    const page: Page = await this.repository.updateContent(id, content, textContent);
    return this.toDTO(page);
  }

  /**
   * Delete a page (soft delete)
   */
  async deletePage(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Permanently delete a page
   */
  async hardDeletePage(id: string): Promise<void> {
    await this.repository.hardDelete(id);
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.repository.incrementViewCount(id);
  }

  /**
   * Get breadcrumbs for a page
   */
  async getBreadcrumbs(pageId: string): Promise<PageSummaryDTO[]> {
    const pages: Page[] = await this.repository.getBreadcrumbs(pageId);
    return pages.map((p) => this.toSummaryDTO(p));
  }

  /**
   * Get recent pages
   */
  async getRecentPages(limit = 10): Promise<PageSummaryDTO[]> {
    const pages: Page[] = await this.repository.findRecent(limit);
    return pages.map((p) => this.toSummaryDTO(p));
  }

  /**
   * Get popular pages
   */
  async getPopularPages(limit = 10): Promise<PageSummaryDTO[]> {
    const pages: Page[] = await this.repository.findPopular(limit);
    return pages.map((p) => this.toSummaryDTO(p));
  }
}
