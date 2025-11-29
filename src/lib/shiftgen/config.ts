/**
 * ShiftGen Configuration
 * Configuration constants for the scraper
 */

import { SiteConfig } from './types';

// ShiftGen base URL
export const BASE_URL = 'https://legacy.shiftgen.com';

// Sites to fetch (same as Discord bot)
export const SITES_TO_FETCH: SiteConfig[] = [
  { id: '82', name: 'St Joseph Scribe' },
  { id: '80', name: 'St Joseph/CHOC Physician' },
  { id: '84', name: 'St Joseph/CHOC MLP' },
];

// Timing delays (in milliseconds)
export const SITE_CHANGE_DELAY = 2000;
export const PAGE_LOAD_DELAY = 1000;

// Name legend default path
export const NAME_LEGEND_PATH = 'feature/shiftgen/name_legend.json';
