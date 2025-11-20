import type { JSONContent } from '@tiptap/core';
import type { PageType } from '@prisma/client';

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

export interface CreatePageInput {
  slug: string;
  title: string;
  content?: JSONContent;
  type: PageType;
  parentId?: string;
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
  icon?: string;
  coverPhoto?: string;
  category?: string;
  tags?: string[];
  parentId?: string;
  position?: string;
  updatedBy?: string;
}

export interface PageSearchFilters {
  type?: PageType;
  category?: string;
  tags?: string[];
  searchQuery?: string;
  includeDeleted?: boolean;
}
