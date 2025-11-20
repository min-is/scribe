/**
 * Provider Data Transfer Objects (DTOs)
 *
 * Type-safe data contracts for Provider-related operations.
 */

import { JSONContent } from '@tiptap/core';
import { WikiContent } from '@/provider/wiki-schema';
import { PageDTO } from './page.dto';

/**
 * Provider DTO - Complete provider data
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
  viewCount: number;
  searchClickCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Provider with Page - Complete provider data including page content
 */
export interface ProviderWithPageDTO extends ProviderDTO {
  page: PageDTO | null;
}

/**
 * Provider Profile DTO - Display data for provider profile page
 */
export interface ProviderProfileDTO {
  id: string;
  slug: string;
  name: string;
  credentials: string | null;
  generalDifficulty: number | null;
  speedDifficulty: number | null;
  terminologyDifficulty: number | null;
  noteDifficulty: number | null;
  content: JSONContent;
  viewCount: number;
}

/**
 * Create Provider Input
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
}

/**
 * Update Provider Input
 */
export interface UpdateProviderInput {
  name?: string;
  credentials?: string;
  generalDifficulty?: number;
  speedDifficulty?: number;
  terminologyDifficulty?: number;
  noteDifficulty?: number;
  wikiContent?: WikiContent;
}
