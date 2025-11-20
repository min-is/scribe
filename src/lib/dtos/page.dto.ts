/**
 * Page Data Transfer Objects
 *
 * Type-safe contracts for Page data throughout the application.
 */

import { JSONContent } from '@tiptap/core';
import { PageType } from '@prisma/client';

/**
 * Complete Page DTO
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
  viewCount: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

/**
 * Simplified Page DTO for lists
 */
export interface PageSummaryDTO {
  id: string;
  slug: string;
  title: string;
  type: PageType;
  icon: string | null;
  category: string | null;
  tags: string[];
  viewCount: number;
  updatedAt: Date;
}

/**
 * Input for creating a new Page
 */
export interface CreatePageInput {
  slug: string;
  title: string;
  content?: JSONContent;
  type: PageType;
  parentId?: string;
  icon?: string;
  coverPhoto?: string;
  category?: string;
  tags?: string[];
  createdBy?: string;
}

/**
 * Input for updating a Page
 */
export interface UpdatePageInput {
  title?: string;
  content?: JSONContent;
  icon?: string;
  coverPhoto?: string;
  category?: string;
  tags?: string[];
  parentId?: string;
  position?: string;
  updatedBy?: string;
}

/**
 * Filters for searching pages
 */
export interface PageSearchFilters {
  type?: PageType;
  category?: string;
  tags?: string[];
  includeDeleted?: boolean;
  parentId?: string | null;
}
