/**
 * Page Data Transfer Objects (DTOs)
 *
 * Type-safe data contracts for Page-related operations.
 * DTOs provide a clean separation between database models and application logic,
 * ensuring type safety throughout the stack.
 */

import { JSONContent } from '@tiptap/core';
import { PageType } from '@prisma/client';

/**
 * Page DTO - Complete page data for display
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
 * Page Summary DTO - Lightweight page data for lists
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
 * Create Page Input - Data required to create a new page
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
 * Update Page Input - Data for updating a page
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
 * Page Search Filters
 */
export interface PageSearchFilters {
  type?: PageType[];
  category?: string;
  tags?: string[];
  parentId?: string | null;
  includeDeleted?: boolean;
  query?: string;
}

/**
 * Page with hierarchy information
 */
export interface PageWithHierarchyDTO extends PageDTO {
  parent: PageSummaryDTO | null;
  children: PageSummaryDTO[];
  breadcrumbs: PageSummaryDTO[];
}
