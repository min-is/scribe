import type { WikiContent } from '../utils/content-transformers';
import type { Prisma } from '@prisma/client';

export interface ProviderDTO {
  id: string;
  slug: string;
  name: string;
  credentials: string | null;
  generalDifficulty: number | null;
  speedDifficulty: number | null;
  terminologyDifficulty: number | null;
  noteDifficulty: number | null;
  noteTemplate: string | null;
  noteSmartPhrase: string | null;
  preferences: Prisma.JsonValue | null;
  wikiContent: WikiContent | null;
  viewCount: number;
  searchClickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderProfileDTO extends ProviderDTO {
  pageId: string | null;
  pageSlug: string | null;
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
  preferences?: Prisma.JsonValue;
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
  preferences?: Prisma.JsonValue;
  wikiContent?: WikiContent;
}
