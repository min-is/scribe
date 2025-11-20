/**
 * Page Service
 *
 * Business logic layer for Page operations
 */

import { PrismaClient } from '@prisma/client';
import { PageRepository } from '../repositories';
import {
  PageDTO,
  PageSummaryDTO,
  CreatePageInput,
  UpdatePageInput,
  PageSearchFilters,
  PageHierarchyEntry,
} from '../dtos';
import {
  validateTipTapContent,
  parseTipTapContent,
  isCorruptedPageContent,
} from '../utils/type-guards';
import { tipTapToPlainText, textToTipTap } from '../utils/content-transformers';
import { toInputJsonValue } from '../utils/json-helpers';
import { JSONContent } from '@tiptap/core';

export class PageService {
  private pageRepo: PageRepository;

  constructor(prisma: PrismaClient) {
    this.pageRepo = new PageRepository(prisma);
  }

  /**
   * Get page by slug
   */
  async getPageBySlug(slug: string): Promise<PageDTO | null> {
    const page = await this.pageRepo.findBySlug(slug);

    if (!page) return null;

    // Check for corrupted content and fix if needed
    let content = parseTipTapContent(page.content);

    if (isCorruptedPageContent(page.content)) {
      // This page has corrupted content, use fallback
      content = textToTipTap('Content is being migrated. Please refresh in a moment.');
    }

    if (!content) {
      content = textToTipTap('');
    }

    return this.mapToDTO(page, content);
  }

  /**
   * Get page by ID
   */
  async getPageById(id: string): Promise<PageDTO | null> {
    const page = await this.pageRepo.findById(id);

    if (!page) return null;

    const content = parseTipTapContent(page.content) || textToTipTap('');

    return this.mapToDTO(page, content);
  }

  /**
   * Create a new page
   */
  async createPage(input: CreatePageInput): Promise<PageDTO> {
    // Validate content if provided
    const content = input.content || textToTipTap('');

    const validation = validateTipTapContent(content);
    if (!validation.valid) {
      throw new Error(`Invalid content: ${validation.error}`);
    }

    // Generate searchable text
    const textContent = tipTapToPlainText(content);

    // Create page
    const page = await this.pageRepo.create({
      slug: input.slug,
      title: input.title,
      content: toInputJsonValue(content),
      textContent,
      type: input.type,
      icon: input.icon || null,
      coverPhoto: input.coverPhoto || null,
      parentId: input.parentId || null,
      tags: input.tags || [],
      viewCount: 0,
      // Type-specific relations
      providerId: input.providerId || null,
      procedureId: input.procedureId || null,
      smartPhraseId: input.smartPhraseId || null,
      scenarioId: input.scenarioId || null,
    });

    return this.mapToDTO(page, content);
  }

  /**
   * Update page content
   */
  async updatePageContent(id: string, input: UpdatePageInput): Promise<PageDTO> {
    const updateData: any = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.content !== undefined) {
      const validation = validateTipTapContent(input.content);
      if (!validation.valid) {
        throw new Error(`Invalid content: ${validation.error}`);
      }

      updateData.content = toInputJsonValue(input.content);
      updateData.textContent = tipTapToPlainText(input.content);
    }

    if (input.icon !== undefined) {
      updateData.icon = input.icon;
    }

    if (input.coverPhoto !== undefined) {
      updateData.coverPhoto = input.coverPhoto;
    }

    if (input.parentId !== undefined) {
      updateData.parentId = input.parentId;
    }

    if (input.tags !== undefined) {
      updateData.tags = input.tags;
    }

    const page = await this.pageRepo.update(id, updateData);

    const content = parseTipTapContent(page.content) || textToTipTap('');

    return this.mapToDTO(page, content);
  }

  /**
   * Search pages
   */
  async searchPages(filters: PageSearchFilters): Promise<PageSummaryDTO[]> {
    const pages = await this.pageRepo.findWithFilters(filters);

    return pages.map((page) => ({
      id: page.id,
      slug: page.slug,
      title: page.title,
      type: page.type,
      icon: page.icon,
      viewCount: page.viewCount,
      updatedAt: page.updatedAt,
    }));
  }

  /**
   * Get page breadcrumbs
   */
  async getBreadcrumbs(pageId: string): Promise<PageHierarchyEntry[]> {
    const pages = await this.pageRepo.getBreadcrumbs(pageId);

    return pages.map((page) => ({
      id: page.id,
      slug: page.slug,
      title: page.title,
      icon: page.icon,
    }));
  }

  /**
   * Get recent pages
   */
  async getRecentPages(limit = 10): Promise<PageSummaryDTO[]> {
    const pages = await this.pageRepo.findRecent(limit);

    return pages.map((page) => ({
      id: page.id,
      slug: page.slug,
      title: page.title,
      type: page.type,
      icon: page.icon,
      viewCount: page.viewCount,
      updatedAt: page.updatedAt,
    }));
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.pageRepo.incrementViewCount(id);
  }

  /**
   * Delete page (soft delete)
   */
  async deletePage(id: string): Promise<void> {
    await this.pageRepo.softDelete(id);
  }

  /**
   * Map Prisma model to DTO
   */
  private mapToDTO(page: any, content: JSONContent): PageDTO {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      content,
      textContent: page.textContent,
      type: page.type,
      icon: page.icon,
      coverPhoto: page.coverPhoto,
      parentId: page.parentId,
      tags: page.tags,
      viewCount: page.viewCount,
      deletedAt: page.deletedAt,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }
}
