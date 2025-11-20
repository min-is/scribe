import { PageType } from '@prisma/client';
import { JSONContent } from '@tiptap/core';

/**
 * Page Data Transfer Objects
 *
 * Clean, type-safe contracts between layers.
 * Separates database models from application logic.
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

export interface CreatePageInput {
  slug: string;
  title: string;
  content?: JSONContent;
  type: PageType;
  parentId?: string | null;
  position?: string;
  icon?: string;
  coverPhoto?: string;
  category?: string;
  tags?: string[];
  createdBy?: string;
}

export interface UpdatePageInput {
  title?: string;
  content?: JSONContent;
  parentId?: string | null;
  position?: string;
  icon?: string;
  coverPhoto?: string;
  category?: string;
  tags?: string[];
  updatedBy?: string;
}

export interface PageSearchFilters {
  query?: string;
  type?: PageType;
  category?: string;
  tags?: string[];
  parentId?: string | null;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}

export interface PageHierarchyDTO extends PageDTO {
  parent?: PageSummaryDTO | null;
  children?: PageSummaryDTO[];
}

export interface BreadcrumbDTO {
  id: string;
  slug: string;
  title: string;
  icon?: string | null;
}
