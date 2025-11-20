/**
 * Page Data Transfer Objects
 *
 * Type-safe contracts for Page data throughout the application.
 * These DTOs provide a clean separation between database models and application logic.
 */

import { PageType } from '@prisma/client';
import { JSONContent } from '@tiptap/core';

/**
 * Complete page data transfer object
 */
export interface PageDTO {
  id: string;
  slug: string;
  title: string;
  content: JSONContent;
  textContent: string | null;
  type: PageType;
  parentId: string | null;
  position: string;
  icon: string | null;
  coverPhoto: string | null;
  category: string | null;
  tags: string[];
  deletedAt: Date | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

/**
 * Lightweight page summary for lists
 */
export interface PageSummaryDTO {
  id: string;
  slug: string;
  title: string;
  type: PageType;
  icon: string | null;
  category: string | null;
  viewCount: number;
  updatedAt: Date;
}

/**
 * Input for creating a new page
 */
export interface CreatePageInput {
  slug: string;
  title: string;
  content?: JSONContent;
  textContent?: string;
  type: PageType;
  parentId?: string;
  icon?: string;
  coverPhoto?: string;
  category?: string;
  tags?: string[];
  createdBy?: string;
}

/**
 * Input for updating an existing page
 */
export interface UpdatePageInput {
  slug?: string;
  title?: string;
  content?: JSONContent;
  textContent?: string;
  parentId?: string;
  icon?: string;
  coverPhoto?: string;
  category?: string;
  tags?: string[];
  updatedBy?: string;
}

/**
 * Search filters for pages
 */
export interface PageSearchFilters {
  type?: PageType;
  category?: string;
  tags?: string[];
  parentId?: string;
  includeDeleted?: boolean;
}
