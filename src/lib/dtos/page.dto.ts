/**
 * Page Data Transfer Objects
 * Type-safe contracts for page data throughout the application
 */

import { JSONContent } from '@tiptap/core';
import { PageType } from '@prisma/client';

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
 * Minimal page summary for lists
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
 * Input for creating a new page
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
 * Input for updating a page
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
 * Page search filters
 */
export interface PageSearchFilters {
  type?: PageType;
  category?: string;
  tags?: string[];
  includeDeleted?: boolean;
  parentId?: string | null;
}
