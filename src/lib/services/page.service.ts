/**
 * Page Service
 *
 * Business logic layer for Page operations.
 * Handles validation, transformation, and coordination between repositories.
 */

import { PrismaClient, Page } from '@prisma/client';
import { JSONContent } from '@tiptap/core';
import { PageRepository } from '../repositories/page.repository';
import {
  PageDTO,
  PageSummaryDTO,
  CreatePageInput,
  UpdatePageInput,
  PageSearchFilters,
} from '../dtos/page.dto';
import { validateTipTapContent } from '../utils/type-guards';
import { tipTapToPlainText } from '../utils/content-transformers';
import { toInputJsonValue } from '../utils/json-helpers';

export class PageService {
  private pageRepo: PageRepository;

  constructor(prisma: PrismaClient) {
    this.pageRepo = new PageRepository(prisma);
  }

  /**
   * Get a page by slug
   */
  async getPageBySlug(slug: string, includeDeleted = false): Promise<PageDTO | null> {
    const page: Page | null = await this.pageRepo.findBySlug(slug, includeDeleted);
    return page ? this.mapToDTO(page) : null;
  }

  /**
   * Get a page by ID
   */
  async getPageById(id: string, includeDeleted = false): Promise<PageDTO | null> {
    const page: Page | null = await this.pageRepo.findById(id, includeDeleted);
    return page ? this.mapToDTO(page) : null;
  }

  /**
   * Create a new page
   */
  async createPage(input: CreatePageInput): Promise<PageDTO> {
    // Validate content if provided
    if (input.content) {
      const validation = validateTipTapContent(input.content);
      if (!validation.isValid) {
        throw new Error(`Invalid TipTap content: ${validation.error}`);
      }
    }

    // Generate text content for search if content is provided
    const content = input.content || { type: 'doc', content: [] };
    const textContent = tipTapToPlainText(content);

    const page: Page = await this.pageRepo.create({
      ...input,
      content,
    });

    // Update text content separately (if needed)
    if (textContent) {
      await this.pageRepo.updateContent(page.id, toInputJsonValue(content), textContent);
    }

    return this.mapToDTO(page);
  }

  /**
   * Update page content
   */
  async updatePageContent(id: string, content: JSONContent, updatedBy?: string): Promise<PageDTO> {
    // Validate content
    const validation = validateTipTapContent(content);
    if (!validation.isValid) {
      throw new Error(`Invalid TipTap content: ${validation.error}`);
    }

    // Generate text content for search
    const textContent = tipTapToPlainText(content);

    const page: Page = await this.pageRepo.updateContent(id, toInputJsonValue(content), textContent);

    // Update updatedBy if provided
    if (updatedBy) {
      await this.pageRepo.update(id, { updatedBy });
    }

    return this.mapToDTO(page);
  }

  /**
   * Update page metadata
   */
  async updatePage(id: string, input: UpdatePageInput): Promise<PageDTO> {
    // Validate content if provided
    if (input.content) {
      const validation = validateTipTapContent(input.content);
      if (!validation.isValid) {
        throw new Error(`Invalid TipTap content: ${validation.error}`);
      }
    }

    const page: Page = await this.pageRepo.update(id, input);
    return this.mapToDTO(page);
  }

  /**
   * Search pages
   */
  async searchPages(filters: PageSearchFilters): Promise<PageDTO[]> {
    const pages: Page[] = await this.pageRepo.findWithFilters(filters);
    return pages.map((page) => this.mapToDTO(page));
  }

  /**
   * Delete a page (soft delete)
   */
  async deletePage(id: string): Promise<void> {
    await this.pageRepo.delete(id);
  }

  /**
   * Increment view count
   */
  async trackPageView(id: string): Promise<void> {
    await this.pageRepo.incrementViewCount(id);
  }

  /**
   * Get page hierarchy
   */
  async getPageChildren(parentId: string | null = null): Promise<PageDTO[]> {
    const pages: Page[] = await this.pageRepo.findWithHierarchy(parentId);
    return pages.map((page) => this.mapToDTO(page));
  }

  /**
   * Get breadcrumbs for a page
   */
  async getBreadcrumbs(pageId: string): Promise<PageSummaryDTO[]> {
    const pages: Page[] = await this.pageRepo.getBreadcrumbs(pageId);
    return pages.map((page) => this.mapToSummaryDTO(page));
  }

  /**
   * Map Page model to DTO
   */
  private mapToDTO(page: Page): PageDTO {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      content: page.content as JSONContent,
      textContent: page.textContent,
      type: page.type,
      parentId: page.parentId,
      position: page.position,
      icon: page.icon,
      coverPhoto: page.coverPhoto,
      category: page.category,
      tags: page.tags,
      viewCount: page.viewCount,
      deletedAt: page.deletedAt,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      createdBy: page.createdBy,
      updatedBy: page.updatedBy,
    };
  }

  /**
   * Map Page model to summary DTO
   */
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
}
