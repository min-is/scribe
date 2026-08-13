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

/**
 * Sites whose shifts are parsed but never synced.
 *
 * This app covers St Joseph only. The multi-site view also returns the CHOC
 * scribe schedule, which collides with St Joseph in the database: both run a
 * "PA" shift starting at 2000, and Shift is unique on (date, zone, startTime),
 * so one silently overwrote the other once per day. Dropping CHOC removes every
 * collision without needing to widen that constraint.
 *
 * This is an exclude-list rather than an include-list on purpose. The provider
 * schedules are named "St Joseph/CHOC Physician" and "St Joseph/CHOC MLP" — they
 * serve both hospitals, and matching scribes to providers depends on them, so an
 * include-list keyed on "St Joseph Scribe" would silently drop them.
 */
export const IGNORED_SITES: readonly string[] = ['CHOC Scribe'];

/**
 * Whether a site's shifts should be skipped during sync.
 */
export function isIgnoredSite(site: string): boolean {
  return IGNORED_SITES.some(
    (ignored) => ignored.toLowerCase() === site.trim().toLowerCase()
  );
}

// Timing settings (milliseconds)
export const PAGE_LOAD_DELAY = 1000;

// Name legend file path (relative to project root)
export const NAME_LEGEND_FILE = 'feature/shiftgen/name_legend.json';
