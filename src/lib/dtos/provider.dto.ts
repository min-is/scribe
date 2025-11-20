/**
 * Provider Data Transfer Objects
 *
 * Type-safe contracts for Provider data throughout the application
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
  wikiContent: WikiContent | null;
  noteTemplate: string | null;
  noteSmartPhrase: string | null;
  preferences: unknown;
  viewCount: number;
  searchClickCount: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Provider with associated page
 */
export interface ProviderWithPageDTO extends ProviderDTO {
  page: PageDTO | null;
}

/**
 * Provider profile data for display
 */
export interface ProviderProfileDTO {
  provider: ProviderDTO;
  page: PageDTO | null;
  stats: {
    totalViews: number;
    searchClicks: number;
    lastUpdated: Date;
  };
}

/**
 * Input for creating a new provider
 */
export interface CreateProviderInput {
  slug: string;
  name: string;
  credentials?: string;
  generalDifficulty?: number;
  wikiContent?: WikiContent;
  noteTemplate?: string;
  noteSmartPhrase?: string;
  preferences?: unknown;
}

/**
 * Input for updating a provider
 */
export interface UpdateProviderInput {
  name?: string;
  credentials?: string;
  generalDifficulty?: number;
  wikiContent?: WikiContent;
  noteTemplate?: string;
  noteSmartPhrase?: string;
  preferences?: unknown;
}

/**
 * Provider search filters
 */
export interface ProviderSearchFilters {
  difficulty?: number;
  hasWikiContent?: boolean;
  includeDeleted?: boolean;
  searchQuery?: string;
}
