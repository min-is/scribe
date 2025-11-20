/**
 * Provider DTOs (Data Transfer Objects)
 *
 * Type-safe contracts for Provider data.
 */

import type { WikiContent } from '@/provider/wiki-schema';
import type { PageDTO } from './page.dto';

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
  preferences: Record<string, unknown> | null;
  wikiContent: WikiContent | null;
  page: PageDTO | null;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderProfileDTO {
  id: string;
  slug: string;
  name: string;
  credentials: string | null;
  wikiContent: WikiContent | null;
  noteTemplate: string | null;
  noteSmartPhrase: string | null;
  page: PageDTO | null;
  viewCount: number;
}

export interface CreateProviderInput {
  slug: string;
  name: string;
  credentials?: string;
  generalDifficulty?: number;
  noteTemplate?: string;
  wikiContent?: WikiContent;
  preferences?: Record<string, unknown>;
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
  preferences?: Record<string, unknown>;
  wikiContent?: WikiContent;
}
