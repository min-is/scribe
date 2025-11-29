/**
 * ShiftGen Integration Constants
 *
 * Zone mappings, color schemes, and configuration for the shift scheduling system.
 * Replaces Discord bot emoji-based system with minimalistic Apple-inspired design.
 */

export const ZONE_CONFIG = {
  // Zone 1 - Blue
  'B': { label: 'Zone 1', color: 'blue', description: 'Zone 1' },
  'F': { label: 'Zone 1', color: 'blue', description: 'Zone 1' },
  'X': { label: 'Zone 1', color: 'blue', description: 'Zone 1' },

  // Zone 2 - Red
  'A': { label: 'Zone 2', color: 'red', description: 'Zone 2' },
  'E': { label: 'Zone 2', color: 'red', description: 'Zone 2' },
  'I': { label: 'Zone 2', color: 'red', description: 'Zone 2' },

  // Zone 3/4 - Amber
  'C': { label: 'Zone 3/4', color: 'amber', description: 'Zone 3/4' },
  'G': { label: 'Zone 3/4', color: 'amber', description: 'Zone 3/4' },

  // Fast Track - Purple
  'D': { label: 'Fast Track', color: 'purple', description: 'Fast Track' },
  'H': { label: 'Fast Track', color: 'purple', description: 'Fast Track' },

  // PA/MLP - Emerald
  'PA': { label: 'PA', color: 'emerald', description: 'Physician Assistant' },

  // Overflow - Stone
  'PIT': { label: 'Overflow', color: 'stone', description: 'Overflow / PIT' },
} as const;

/**
 * Tailwind CSS classes for zone colors
 * Uses subtle borders and backgrounds for minimalistic design
 */
export const ZONE_STYLES = {
  blue: {
    border: 'border-l-4 border-blue-500/30',
    bg: 'bg-blue-500/5',
    text: 'text-blue-700 dark:text-blue-300',
    badge: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  },
  red: {
    border: 'border-l-4 border-red-500/30',
    bg: 'bg-red-500/5',
    text: 'text-red-700 dark:text-red-300',
    badge: 'bg-red-500/10 text-red-700 dark:text-red-300',
  },
  amber: {
    border: 'border-l-4 border-amber-500/30',
    bg: 'bg-amber-500/5',
    text: 'text-amber-700 dark:text-amber-300',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  purple: {
    border: 'border-l-4 border-purple-500/30',
    bg: 'bg-purple-500/5',
    text: 'text-purple-700 dark:text-purple-300',
    badge: 'bg-purple-500/10 text-purple-700 dark:text-purple-300',
  },
  emerald: {
    border: 'border-l-4 border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-700 dark:text-emerald-300',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  },
  stone: {
    border: 'border-l-4 border-stone-500/30',
    bg: 'bg-stone-500/5',
    text: 'text-stone-700 dark:text-stone-300',
    badge: 'bg-stone-500/10 text-stone-700 dark:text-stone-300',
  },
} as const;

/**
 * Time period categorization
 * Used for grouping shifts into Morning, Afternoon, Night
 */
export const TIME_PERIODS = {
  MORNING: { start: 5, end: 11, label: 'Morning', icon: '☀️' },
  AFTERNOON: { start: 11, end: 18, label: 'Afternoon/Evening', icon: '🌤️' },
  NIGHT: { start: 18, end: 5, label: 'Night', icon: '🌙' },
} as const;

/**
 * ShiftGen site IDs for API scraping
 * These correspond to the different schedules in ShiftGen
 */
export const SHIFTGEN_SITES = {
  ST_JOSEPH_SCRIBE: { id: 'scribe_site_id', name: 'St Joseph Scribe' },
  ST_JOSEPH_PHYSICIAN: { id: 'physician_site_id', name: 'St Joseph Physician' },
  ST_JOSEPH_MLP: { id: 'mlp_site_id', name: 'St Joseph MLP' },
} as const;

/**
 * Refresh configuration
 */
export const REFRESH_CONFIG = {
  INTERVAL_HOURS: 12,
  TIMEZONE: 'America/Los_Angeles', // PST/PDT
  CRON_SCHEDULE: '0 */12 * * *', // Every 12 hours
} as const;

/**
 * Helper function to get zone configuration
 */
export function getZoneConfig(zone: string) {
  return ZONE_CONFIG[zone as keyof typeof ZONE_CONFIG] || {
    label: zone,
    color: 'stone' as const,
    description: zone,
  };
}

/**
 * Helper function to get zone styles
 */
export function getZoneStyles(zone: string) {
  const config = getZoneConfig(zone);
  return ZONE_STYLES[config.color];
}

/**
 * Helper function to categorize shift by time period
 */
export function getTimePeriod(startTime: string): keyof typeof TIME_PERIODS {
  // Parse startTime (format: "0800" or "800")
  const hour = parseInt(startTime.padStart(4, '0').slice(0, 2), 10);

  if (hour >= TIME_PERIODS.MORNING.start && hour < TIME_PERIODS.MORNING.end) {
    return 'MORNING';
  } else if (hour >= TIME_PERIODS.AFTERNOON.start && hour < TIME_PERIODS.AFTERNOON.end) {
    return 'AFTERNOON';
  } else {
    return 'NIGHT';
  }
}

/**
 * Helper function to format time for display
 * Converts "0800" to "08:00", "800" to "08:00"
 */
export function formatTime(time: string): string {
  const padded = time.padStart(4, '0');
  return `${padded.slice(0, 2)}:${padded.slice(2)}`;
}

/**
 * Helper function to format time range
 * Converts "0800-1600" to "08:00-16:00"
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)}-${formatTime(endTime)}`;
}
