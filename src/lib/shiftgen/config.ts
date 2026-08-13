/**
 * ShiftGen Scraper Configuration
 */

/**
 * ShiftGen base URL.
 *
 * The legacy host (legacy.shiftgen.com) has been sunset, so this is
 * environment-driven to avoid another hard-coded host going stale.
 */
export const BASE_URL =
  process.env.SHIFTGEN_BASE_URL || 'https://www.shiftgen.com';

/**
 * The multi-site schedule view.
 *
 * This single page renders every schedule the authenticated account can see
 * (each site's schedule is a separate group within it), which replaces the old
 * "switch site -> list schedules -> open print version" loop.
 */
export const MULTI_SITE_SCHEDULE_PATH = '/member/multi_site_schedule';

// Timing settings (milliseconds)
export const PAGE_LOAD_DELAY = 1000;

// Name legend file path (relative to project root)
export const NAME_LEGEND_FILE = 'feature/shiftgen/name_legend.json';
