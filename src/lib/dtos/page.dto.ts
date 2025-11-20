/**
 * Page Data Transfer Objects (DTOs)
 *
 * Type-safe contracts for Page data throughout the application.
 * These DTOs provide a clean separation between database models
 * and application logic.
 */

import { JSONContent } from '@tiptap/core';
import { PageType } from '@prisma/client';

/**
 * Complete Page DTO with all fields
 */
export interface PageDTO {
  id: string;
  slug: string;
  title: string;
  content: JSONContent;
  textContent?: string | null;
  type: PageType;
  parentId?: string | null;
  position: string;
  icon?: string | null;
  coverPhoto?: string | null;
  category?: string | null;
  tags: string[];
  viewCount: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
}

/**
 * Simplified Page DTO for lists and previews
 */
export interface PageSummaryDTO {
  id: string;
  slug: string;
  title: string;
  type: PageType;
  icon?: string | null;
  category?: string | null;
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
  parentId?: string | null;
  position?: string;
  icon?: string | null;
  coverPhoto?: string | null;
  category?: string | null;
  tags?: string[];
  createdBy?: string | null;
  providerId?: string | null;
  procedureId?: string | null;
  scenarioId?: string | null;
  smartPhraseId?: string | null;
}

/**
 * Input for updating an existing page
 */
export interface UpdatePageInput {
  title?: string;
  content?: JSONContent;
  parentId?: string | null;
  position?: string;
  icon?: string | null;
  coverPhoto?: string | null;
  category?: string | null;
  tags?: string[];
  updatedBy?: string | null;
}

/**
 * Page search filters
 */
export interface PageSearchFilters {
  type?: PageType;
  category?: string;
  tags?: string[];
  parentId?: string | null;
  includeDeleted?: boolean;
  query?: string;
  limit?: number;
  offset?: number;
}
