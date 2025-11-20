/**
 * Page Service
 *
 * Business logic layer for Page operations.
 * Orchestrates data access, transformations, and validation.
 */

import { PageRepository } from '../repositories/page.repository';
import { ContentTransformers } from '../content-transformers';
import { isTipTapContent, validateTipTapContent } from '../type-guards';
import {
  PageDTO,
  PageSummaryDTO,
  PageWithHierarchyDTO,
  CreatePageInput,
  UpdatePageInput,
  PageSearchFilters,
} from '../dtos/page.dto';
import { Page, PageType } from '@prisma/client';
import { JSONContent } from '@tiptap/core';

export class PageService {
  private repository: PageRepository;

  constructor() {
    this.repository = new PageRepository();
  }

  /**
   * Get a page by slug
   */
  async getPageBySlug(slug: string): Promise<PageDTO | null> {
    const page = await this.repository.findBySlug(slug);
    return page ? this.mapToDTO(page) : null;
  }

  /**
   * Get a page by ID
   */
  async getPageById(id: string): Promise<PageDTO | null> {
    const page = await this.repository.findById(id);
    return page ? this.mapToDTO(page) : null;
  }

  /**
   * Get page with hierarchy (parent, children, breadcrumbs)
   */
  async getPageWithHierarchy(id: string): Promise<PageWithHierarchyDTO | null> {
    const pageWithRelations = await this.repository.findWithHierarchy(id);
    if (!pageWithRelations) return null;

    const breadcrumbs = await this.repository.getBreadcrumbs(id);

    return {
      ...this.mapToDTO(pageWithRelations),
      parent: pageWithRelations.parent ? this.mapToSummaryDTO(pageWithRelations.parent) : null,
      children: pageWithRelations.children.map(this.mapToSummaryDTO),
      breadcrumbs: breadcrumbs.map(this.mapToSummaryDTO),
    };
  }

  /**
   * Search pages with filters
   */
  async searchPages(filters: PageSearchFilters): Promise<PageSummaryDTO[]> {
    const pages = await this.repository.findWithFilters(filters);
    return pages.map(this.mapToSummaryDTO);
  }

  /**
   * Get pages by type
   */
  async getPagesByType(type: PageType): Promise<PageSummaryDTO[]> {
    const pages = await this.repository.findByType(type);
    return pages.map(this.mapToSummaryDTO);
  }

  /**
   * Create a new page
   */
  async createPage(input: CreatePageInput): Promise<PageDTO> {
    // Validate content if provided
    if (input.content) {
      const validation = validateTipTapContent(input.content);
      if (!validation.valid) {
        throw new Error(`Invalid content structure: ${validation.errors.join(', ')}`);
      }
    }

    // Generate text content for search
    const content = input.content || ContentTransformers.createEmptyDocument();
    const textContent = ContentTransformers.tipTapToPlainText(content);

    const page = await this.repository.create({
      slug: input.slug,
      title: input.title,
      content,
      textContent: textContent || input.title,
      type: input.type,
      parentId: input.parentId,
      icon: input.icon,
      coverPhoto: input.coverPhoto,
      category: input.category,
      tags: input.tags || [],
      createdBy: input.createdBy,
    });

    return this.mapToDTO(page);
  }

  /**
   * Update page content
   */
  async updatePageContent(id: string, content: JSONContent, updatedBy?: string): Promise<PageDTO> {
    // Validate content
    const validation = validateTipTapContent(content);
    if (!validation.valid) {
      throw new Error(`Invalid content structure: ${validation.errors.join(', ')}`);
    }

    // Generate text content for search
    const textContent = ContentTransformers.tipTapToPlainText(content);

    const page = await this.repository.updateContent(id, content, textContent);
    return this.mapToDTO(page);
  }

  /**
   * Update page metadata
   */
  async updatePage(id: string, input: UpdatePageInput): Promise<PageDTO> {
    const updateData: any = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.icon !== undefined) updateData.icon = input.icon;
    if (input.coverPhoto !== undefined) updateData.coverPhoto = input.coverPhoto;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.tags !== undefined) updateData.tags = input.tags;
    if (input.parentId !== undefined) updateData.parentId = input.parentId;
    if (input.position !== undefined) updateData.position = input.position;
    if (input.updatedBy !== undefined) updateData.updatedBy = input.updatedBy;

    // Handle content separately with validation
    if (input.content !== undefined) {
      const validation = validateTipTapContent(input.content);
      if (!validation.valid) {
        throw new Error(`Invalid content structure: ${validation.errors.join(', ')}`);
      }
      updateData.content = input.content;
      updateData.textContent = ContentTransformers.tipTapToPlainText(input.content);
    }

    const page = await this.repository.update(id, updateData);
    return this.mapToDTO(page);
  }

  /**
   * Increment page view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.repository.incrementViewCount(id);
  }

  /**
   * Soft delete a page
   */
  async deletePage(id: string): Promise<PageDTO> {
    const page = await this.repository.softDelete(id);
    return this.mapToDTO(page);
  }

  /**
   * Restore a deleted page
   */
  async restorePage(id: string): Promise<PageDTO> {
    const page = await this.repository.restore(id);
    return this.mapToDTO(page);
  }

  /**
   * Get recent pages
   */
  async getRecentPages(limit: number = 10, type?: PageType): Promise<PageSummaryDTO[]> {
    const pages = await this.repository.findRecent(limit, type);
    return pages.map(this.mapToSummaryDTO);
  }

  /**
   * Get popular pages
   */
  async getPopularPages(limit: number = 10, type?: PageType): Promise<PageSummaryDTO[]> {
    const pages = await this.repository.findPopular(limit, type);
    return pages.map(this.mapToSummaryDTO);
  }

  /**
   * Map Page model to DTO
   */
  private mapToDTO(page: Page): PageDTO {
    // Ensure content is valid JSONContent
    const content = isTipTapContent(page.content)
      ? (page.content as JSONContent)
      : ContentTransformers.createEmptyDocument();

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
      viewCount: page.viewCount,
      deletedAt: page.deletedAt,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      createdBy: page.createdBy,
      updatedBy: page.updatedBy,
    };
  }

  /**
   * Map Page model to Summary DTO
   */
  private mapToSummaryDTO(page: Page): PageSummaryDTO {
    return {
      id: page.id,
      slug: page.slug,
      title: page.title,
      type: page.type,
      icon: page.icon,
      category: page.category,
      viewCount: page.viewCount,
      updatedAt: page.updatedAt,
    };
  }
}
