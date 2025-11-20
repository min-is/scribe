import { JSONContent } from '@tiptap/core';
import { PageDTO } from './page.dto';

/**
 * Provider Data Transfer Objects
 */

export interface WikiContent {
  version: number;
  sections: WikiSection[];
  media: MediaItem[];
  metadata: {
    lastEditedAt: string;
    totalEdits: number;
  };
}

export interface WikiSection {
  id: string;
  type: string;
  order: number;
  title: string;
  content: JSONContent;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'file';
  caption?: string;
  uploadedAt: string;
}

export interface ProviderDTO {
  id: string;
  slug: string;
  name: string;
  credentials?: string | null;
  generalDifficulty?: number | null;
  speedDifficulty?: number | null;
  terminologyDifficulty?: number | null;
  noteDifficulty?: number | null;
  noteTemplate?: string | null;
  noteSmartPhrase?: string | null;
  preferences?: any;
  wikiContent?: WikiContent | null;
  viewCount: number;
  searchClickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderProfileDTO extends ProviderDTO {
  page?: PageDTO | null;
  content?: JSONContent; // Extracted from wikiContent or page
}

export interface CreateProviderInput {
  slug: string;
  name: string;
  credentials?: string;
  generalDifficulty?: number;
  speedDifficulty?: number;
  terminologyDifficulty?: number;
  noteDifficulty?: number;
  noteTemplate?: string;
  noteSmartPhrase?: string;
  preferences?: any;
  wikiContent?: WikiContent;
}

export interface UpdateProviderInput {
  name?: string;
  credentials?: string;
  generalDifficulty?: number;
  speedDifficulty?: number;
  terminologyDifficulty?: number;
  noteDifficulty?: number;
  noteTemplate?: string;
  noteSmartPhrase?: string;
  preferences?: any;
  wikiContent?: WikiContent;
}
