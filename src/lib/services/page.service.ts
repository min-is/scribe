import { PrismaClient, Page, PageType } from '@prisma/client';
import { JSONContent } from '@tiptap/core';
import { PageRepository } from '../repositories/page.repository';
import { ContentTransformers } from '../content-transformers';
import { validateTipTapContent } from '../type-guards';
import type {
  PageDTO,
  PageSummaryDTO,
  CreatePageInput,
  UpdatePageInput,
  PageSearchFilters,
  PageHierarchyDTO,
  BreadcrumbDTO,
} from '../dtos';

/**
 * Page Service
 *
 * Business logic layer for Page operations.
 * Handles validation, transformations, and orchestration.
 */
export class PageService {
  private pageRepo: PageRepository;

  constructor(prisma: PrismaClient) {
    this.pageRepo = new PageRepository(prisma);
  }

  /**
   * Get page by slug
   */
  async getPageBySlug(
    slug: string,
    includeDeleted = false
  ): Promise<PageDTO | null> {
    const page = await this.pageRepo.findBySlug(slug, includeDeleted);

    if (!page) {
      return null;
    }

    return this.mapToDTO(page);
  }

  /**
   * Get page by ID
   */
  async getPageById(id: string): Promise<PageDTO | null> {
    const page = await this.pageRepo.findById(id);

    if (!page) {
      return null;
    }

    return this.mapToDTO(page);
  }

  /**
   * Get page with hierarchy (parent and children)
   */
  async getPageWithHierarchy(id: string): Promise<PageHierarchyDTO | null> {
    const page = await this.pageRepo.findWithHierarchy(id);

    if (!page) {
      return null;
    }

    return {
      ...this.mapToDTO(page),
      parent: page.parent ? this.mapToSummaryDTO(page.parent) : null,
      children: page.children?.map((child) => this.mapToSummaryDTO(child)),
    };
  }

  /**
   * Get breadcrumb trail for a page
   */
  async getBreadcrumbs(pageId: string): Promise<BreadcrumbDTO[]> {
    const pages = await this.pageRepo.getBreadcrumbs(pageId);

    return pages.map((page) => ({
      id: page.id,
      slug: page.slug,
      title: page.title,
      icon: page.icon,
    }));
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

    const content =
      input.content || ContentTransformers.createEmptyDocument();
    const textContent = ContentTransformers.tipTapToPlainText(content);

    const page = await this.pageRepo.create({
      slug: input.slug,
      title: input.title,
      content,
      textContent,
      type: input.type,
      parentId: input.parentId,
      position: input.position || 'a0',
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
  async updatePageContent(
    id: string,
    content: JSONContent
  ): Promise<PageDTO> {
    // Validate content
    const validation = validateTipTapContent(content);
    if (!validation.valid) {
      throw new Error(`Invalid content: ${validation.error}`);
    }

    const textContent = ContentTransformers.tipTapToPlainText(content);

    const page = await this.pageRepo.updateContent(id, content, textContent);

    return this.mapToDTO(page);
  }

  /**
   * Update page metadata
   */
  async updatePage(id: string, input: UpdatePageInput): Promise<PageDTO> {
    // If content is being updated, validate and generate textContent
    let updateData: any = { ...input };

    if (input.content) {
      const validation = validateTipTapContent(input.content);
      if (!validation.valid) {
        throw new Error(`Invalid content: ${validation.error}`);
      }

      updateData.textContent = ContentTransformers.tipTapToPlainText(
        input.content
      );
    }

    const page = await this.pageRepo.update(id, updateData);

    return this.mapToDTO(page);
  }

  /**
   * Search pages
   */
  async searchPages(filters: PageSearchFilters): Promise<PageDTO[]> {
    const pages = await this.pageRepo.findWithFilters(filters);

    return pages.map((page) => this.mapToDTO(page));
  }

  /**
   * Get pages by type
   */
  async getPagesByType(
    type: PageType,
    includeDeleted = false
  ): Promise<PageSummaryDTO[]> {
    const pages = await this.pageRepo.findByType(type, includeDeleted);

    return pages.map((page) => this.mapToSummaryDTO(page));
  }

  /**
   * Get recent pages
   */
  async getRecentPages(
    limit = 10,
    type?: PageType
  ): Promise<PageSummaryDTO[]> {
    const pages = await this.pageRepo.findRecent(limit, type);

    return pages.map((page) => this.mapToSummaryDTO(page));
  }

  /**
   * Get popular pages
   */
  async getPopularPages(
    limit = 10,
    type?: PageType
  ): Promise<PageSummaryDTO[]> {
    const pages = await this.pageRepo.findPopular(limit, type);

    return pages.map((page) => this.mapToSummaryDTO(page));
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.pageRepo.incrementViewCount(id);
  }

  /**
   * Soft delete a page
   */
  async deletePage(id: string): Promise<PageDTO> {
    const page = await this.pageRepo.softDelete(id);

    return this.mapToDTO(page);
  }

  /**
   * Restore a soft-deleted page
   */
  async restorePage(id: string): Promise<PageDTO> {
    const page = await this.pageRepo.restore(id);

    return this.mapToDTO(page);
  }

  /**
   * Map Prisma model to DTO
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
   * Map Prisma model to summary DTO
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
