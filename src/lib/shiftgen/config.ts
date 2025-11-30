/**
 * ShiftGen Scraper Configuration
 *
 * Configuration for the ShiftGen legacy API scraper including
 * site IDs, timing settings, and file paths.
 */

// ShiftGen Legacy API Base URL
export const BASE_URL = 'https://legacy.shiftgen.com';

// Site IDs to scrape
export const SITES_TO_FETCH = [
  { id: '82', name: 'St Joseph Scribe' },
  { id: '80', name: 'St Joseph/CHOC Physician' },
  { id: '84', name: 'St Joseph/CHOC MLP' },
] as const;

// Timing settings (milliseconds)
export const SITE_CHANGE_DELAY = 2000; // 2 seconds
export const PAGE_LOAD_DELAY = 1000;    // 1 second

// Name legend file path (relative to project root)
export const NAME_LEGEND_FILE = 'feature/shiftgen/name_legend.json';
