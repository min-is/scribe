/**
 * Page DTOs (Data Transfer Objects)
 *
 * Type-safe contracts for Page data.
 * Clean separation between database models and application logic.
 */

import type { JSONContent } from '@tiptap/core';
import type { PageType } from '@prisma/client';

export interface PageDTO {
  id: string;
  slug: string;
  title: string;
  content: JSONContent;
  textContent: string | null;
  type: PageType;
  icon: string | null;
  coverPhoto: string | null;
  viewCount: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PageSummaryDTO {
  id: string;
  slug: string;
  title: string;
  type: PageType;
  icon: string | null;
  updatedAt: Date;
}

export interface CreatePageInput {
  slug: string;
  title: string;
  content?: JSONContent;
  type: PageType;
  icon?: string;
  coverPhoto?: string;
  parentId?: string;
  providerId?: string;
  procedureId?: string;
  scenarioId?: string;
  smartPhraseId?: string;
}

export interface UpdatePageInput {
  title?: string;
  content?: JSONContent;
  icon?: string;
  coverPhoto?: string;
  parentId?: string | null;
}

export interface PageSearchFilters {
  type?: PageType;
  includeDeleted?: boolean;
  parentId?: string | null;
}
