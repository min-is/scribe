/**
 * Provider Data Transfer Objects (DTOs)
 *
 * Type-safe contracts for Provider data throughout the application.
 */

import { WikiContent } from '@/provider/wiki-schema';
import { PageDTO } from './page.dto';

/**
 * Complete Provider DTO
 */
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
  preferences?: unknown;
  wikiContent?: WikiContent | null;
  viewCount: number;
  searchClickCount: number;
  page?: PageDTO | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Provider profile with page data
 */
export interface ProviderProfileDTO {
  id: string;
  slug: string;
  name: string;
  credentials?: string | null;
  generalDifficulty?: number | null;
  speedDifficulty?: number | null;
  terminologyDifficulty?: number | null;
  noteDifficulty?: number | null;
  viewCount: number;
  page?: PageDTO | null;
  wikiContent?: WikiContent | null;
  legacyNoteTemplate?: string | null;
  legacySmartPhrase?: string | null;
}

/**
 * Input for creating a new provider
 */
export interface CreateProviderInput {
  slug: string;
  name: string;
  credentials?: string | null;
  generalDifficulty?: number | null;
  speedDifficulty?: number | null;
  terminologyDifficulty?: number | null;
  noteDifficulty?: number | null;
  noteTemplate?: string | null;
  noteSmartPhrase?: string | null;
  preferences?: unknown;
  wikiContent?: WikiContent | null;
}

/**
 * Input for updating a provider
 */
export interface UpdateProviderInput {
  name?: string;
  credentials?: string | null;
  generalDifficulty?: number | null;
  speedDifficulty?: number | null;
  terminologyDifficulty?: number | null;
  noteDifficulty?: number | null;
  noteTemplate?: string | null;
  noteSmartPhrase?: string | null;
  preferences?: unknown;
  wikiContent?: WikiContent | null;
}
