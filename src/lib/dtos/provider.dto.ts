/**
 * Provider Data Transfer Objects
 *
 * Type-safe contracts for Provider data throughout the application.
 */

import { WikiContent } from '@/provider/wiki-schema';
import { PageDTO } from './page.dto';

/**
 * Complete provider data transfer object
 */
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
  preferences: unknown;
  wikiContent: WikiContent | null;
  viewCount: number;
  searchClickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Provider profile with associated page
 */
export interface ProviderProfileDTO extends ProviderDTO {
  page: PageDTO | null;
}

/**
 * Input for creating a new provider
 */
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
  preferences?: unknown;
  wikiContent?: WikiContent;
}

/**
 * Input for updating an existing provider
 */
export interface UpdateProviderInput {
  name?: string;
  credentials?: string;
  generalDifficulty?: number;
  speedDifficulty?: number;
  terminologyDifficulty?: number;
  noteDifficulty?: number;
  noteTemplate?: string;
  noteSmartPhrase?: string;
  preferences?: unknown;
  wikiContent?: WikiContent;
}
