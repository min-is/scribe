/**
 * Page Service
 *
 * Business logic layer for Page operations.
 * Coordinates between repositories and provides higher-level operations.
 */

import { PrismaClient } from '@prisma/client';
import { PageRepository } from '../repositories';
import { PageDTO, CreatePageInput, UpdatePageInput, PageSearchFilters } from '../dtos';
import { JSONContent } from '@tiptap/core';
import { tipTapToPlainText } from '../utils/content-transformers';
import { validateTipTapContent } from '../utils/type-guards';

export class PageService {
  private pageRepo: PageRepository;

  constructor(prisma: PrismaClient) {
    this.pageRepo = new PageRepository(prisma);
  }

  /**
   * Get a page by slug
   */
  async getPageBySlug(slug: string, includeDeleted = false): Promise<PageDTO | null> {
    const page = await this.pageRepo.findBySlug(slug, includeDeleted);
    if (!page) return null;

    return this.toDTO(page);
  }

  /**
   * Get a page by ID
   */
  async getPageById(id: string): Promise<PageDTO | null> {
    const page = await this.pageRepo.findById(id);
    if (!page) return null;

    return this.toDTO(page);
  }

  /**
   * Find pages with filters
   */
  async findPages(filters?: PageSearchFilters): Promise<PageDTO[]> {
    const pages = await this.pageRepo.findMany(filters);
    return pages.map((page) => this.toDTO(page));
  }

  /**
   * Create a new page
   */
  async createPage(input: CreatePageInput): Promise<PageDTO> {
    // Validate content if provided
    if (input.content) {
      const validation = validateTipTapContent(input.content);
      if (!validation.valid) {
        throw new Error(`Invalid TipTap content: ${validation.error}`);
      }
    }

    // Generate text content for search if not provided
    if (!input.textContent && input.content) {
      input.textContent = tipTapToPlainText(input.content);
    }

    const page = await this.pageRepo.create(input);
    return this.toDTO(page);
  }

  /**
   * Update page content
   */
  async updatePageContent(id: string, content: JSONContent): Promise<PageDTO> {
    // Validate content
    const validation = validateTipTapContent(content);
    if (!validation.valid) {
      throw new Error(`Invalid TipTap content: ${validation.error}`);
    }

    // Generate text content for search
    const textContent = tipTapToPlainText(content);

    const page = await this.pageRepo.updateContent(id, content, textContent);
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
        throw new Error(`Invalid TipTap content: ${validation.error}`);
      }

      // Generate text content for search if not provided
      if (!input.textContent) {
        input.textContent = tipTapToPlainText(input.content);
      }
    }

    const page = await this.pageRepo.update(id, input);
    return this.toDTO(page);
  }

  /**
   * Delete a page (soft delete)
   */
  async deletePage(id: string): Promise<void> {
    await this.pageRepo.delete(id);
  }

  /**
   * Increment page view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.pageRepo.incrementViewCount(id);
  }

  /**
   * Get page hierarchy (parent and children)
   */
  async getPageHierarchy(id: string) {
    return this.pageRepo.findWithHierarchy(id);
  }

  /**
   * Get breadcrumbs for a page
   */
  async getBreadcrumbs(id: string) {
    return this.pageRepo.getBreadcrumbs(id);
  }

  /**
   * Convert Prisma Page to DTO
   */
  private toDTO(page: any): PageDTO {
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
      deletedAt: page.deletedAt,
      viewCount: page.viewCount,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      createdBy: page.createdBy,
      updatedBy: page.updatedBy,
    };
  }
}
