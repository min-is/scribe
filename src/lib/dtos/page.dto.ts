/**
 * Page Data Transfer Objects
 *
 * Type-safe contracts for Page data throughout the application
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
  icon: string | null;
  coverPhoto: string | null;
  parentId: string | null;
  tags: string[];
  viewCount: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Simplified page summary for lists
 */
export interface PageSummaryDTO {
  id: string;
  slug: string;
  title: string;
  type: PageType;
  icon: string | null;
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
  icon?: string;
  coverPhoto?: string;
  parentId?: string;
  tags?: string[];

  // Type-specific metadata
  providerId?: string;
  procedureId?: string;
  smartPhraseId?: string;
  scenarioId?: string;
}

/**
 * Input for updating an existing page
 */
export interface UpdatePageInput {
  title?: string;
  content?: JSONContent;
  icon?: string;
  coverPhoto?: string;
  parentId?: string;
  tags?: string[];
}

/**
 * Page search filters
 */
export interface PageSearchFilters {
  type?: PageType;
  tags?: string[];
  parentId?: string;
  includeDeleted?: boolean;
  searchQuery?: string;
}

/**
 * Page hierarchy entry for breadcrumbs
 */
export interface PageHierarchyEntry {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
}
