/**
 * Page Service
 *
 * Business logic layer for Page operations.
 */

import { PrismaClient, Page, PageType } from '@prisma/client';
import { PageRepository } from '../repositories/page.repository';
import {
  PageDTO,
  PageSummaryDTO,
  CreatePageInput,
  UpdatePageInput,
  PageSearchFilters,
} from '../dtos/page.dto';
import {
  wikiContentToTipTap,
  tipTapToPlainText,
  textToTipTap,
} from '../utils/content-transformers';
import { validateTipTapContent } from '../utils/type-guards';
import { JSONContent } from '@tiptap/core';
import { Prisma } from '@prisma/client';

export class PageService {
  private repository: PageRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new PageRepository(prisma);
  }

  /**
   * Get a page by slug
   */
  async getPageBySlug(
    slug: string,
    includeDeleted = false
  ): Promise<PageDTO | null> {
    const page = await this.repository.findBySlug(slug, includeDeleted);
    return page ? this.toDTO(page) : null;
  }

  /**
   * Get a page by ID
   */
  async getPageById(id: string): Promise<PageDTO | null> {
    const page = await this.repository.findById(id);
    return page ? this.toDTO(page) : null;
  }

  /**
   * Create a new page
   */
  async createPage(input: CreatePageInput): Promise<PageDTO> {
    // Prepare content
    const content = input.content || textToTipTap('');
    validateTipTapContent(content);

    const textContent = tipTapToPlainText(content);

    const page = await this.repository.getModel().create({
      data: {
        slug: input.slug,
        title: input.title,
        content: content as Prisma.InputJsonValue,
        textContent,
        type: input.type,
        parentId: input.parentId,
        icon: input.icon,
        coverPhoto: input.coverPhoto,
        category: input.category,
        tags: input.tags || [],
        createdBy: input.createdBy,
      },
    });

    return this.toDTO(page);
  }

  /**
   * Update page content
   */
  async updatePageContent(
    id: string,
    content: JSONContent
  ): Promise<PageDTO> {
    validateTipTapContent(content);
    const textContent = tipTapToPlainText(content);

    const page = await this.repository.updateContent(id, content, textContent);
    return this.toDTO(page);
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

    if (input.content) {
      validateTipTapContent(input.content);
      updateData.content = input.content as Prisma.InputJsonValue;
      updateData.textContent = tipTapToPlainText(input.content);
    }

    const page = await this.repository.getModel().update({
      where: { id },
      data: updateData,
    });

    return this.toDTO(page);
  }

  /**
   * Search pages
   */
  async searchPages(filters: PageSearchFilters): Promise<PageSummaryDTO[]> {
    const pages = await this.repository.findWithFilters(filters);
    return pages.map(this.toSummaryDTO);
  }

  /**
   * Get pages by type
   */
  async getPagesByType(
    type: PageType,
    includeDeleted = false
  ): Promise<PageSummaryDTO[]> {
    const pages = await this.repository.findByType(type, includeDeleted);
    return pages.map(this.toSummaryDTO);
  }

  /**
   * Get recent pages
   */
  async getRecentPages(
    limit: number,
    includeDeleted = false
  ): Promise<PageSummaryDTO[]> {
    const pages = await this.repository.findRecent(limit, includeDeleted);
    return pages.map(this.toSummaryDTO);
  }

  /**
   * Get popular pages
   */
  async getPopularPages(
    limit: number,
    includeDeleted = false
  ): Promise<PageSummaryDTO[]> {
    const pages = await this.repository.findPopular(limit, includeDeleted);
    return pages.map(this.toSummaryDTO);
  }

  /**
   * Get page breadcrumbs
   */
  async getBreadcrumbs(pageId: string): Promise<PageSummaryDTO[]> {
    const pages = await this.repository.getBreadcrumbs(pageId);
    return pages.map(this.toSummaryDTO);
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
  async softDelete(id: string): Promise<PageDTO> {
    const page = await this.repository.softDelete(id);
    return this.toDTO(page);
  }

  /**
   * Restore a soft-deleted page
   */
  async restore(id: string): Promise<PageDTO> {
    const page = await this.repository.restore(id);
    return this.toDTO(page);
  }

  /**
   * Convert Page model to DTO
   */
  private toDTO(page: Page): PageDTO {
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
   * Convert Page model to SummaryDTO
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
}
