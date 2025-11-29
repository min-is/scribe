/**
 * ShiftGen Constants
 *
 * Zone mappings, color schemes, and time period definitions for shift scheduling.
 * Designed with minimalistic Apple-inspired aesthetics.
 */

import { ZoneConfig, ZoneStyles, TimePeriodConfig, TimePeriod } from './types';

/**
 * Zone Configurations
 *
 * Maps zone identifiers (A, B, C, etc.) to display names and colors.
 * Replaces Discord bot's color emoji system with subtle, clean design.
 */
export const ZONE_CONFIGS: Record<string, ZoneConfig> = {
  A: {
    id: 'A',
    name: 'Zone 1',
    color: 'blue',
    description: 'Main emergency zone (formerly 🟦)',
  },
  B: {
    id: 'B',
    name: 'Zone 2',
    color: 'red',
    description: 'Secondary emergency zone (formerly 🟥)',
  },
  C: {
    id: 'C',
    name: 'Zone 3',
    color: 'amber',
    description: 'Tertiary emergency zone (formerly 🟨)',
  },
  D: {
    id: 'D',
    name: 'Zone 4',
    color: 'amber',
    description: 'Quaternary emergency zone (formerly 🟨)',
  },
  PA: {
    id: 'PA',
    name: 'Physician Assistant',
    color: 'emerald',
    description: 'PA coverage (formerly 🟩)',
  },
  FT: {
    id: 'FT',
    name: 'Fast Track',
    color: 'purple',
    description: 'Fast track zone (formerly 🟪)',
  },
};

/**
 * Get zone configuration by ID
 */
export function getZoneConfig(zoneId: string): ZoneConfig {
  return ZONE_CONFIGS[zoneId] || {
    id: zoneId,
    name: `Zone ${zoneId}`,
    color: 'gray',
  };
}

/**
 * Get Tailwind CSS classes for zone styling
 *
 * Returns classes for:
 * - Subtle colored left border (3px accent)
 * - Muted background (5% opacity)
 * - Text color
 * - Badge styling
 *
 * Design: Minimalistic Apple-inspired with subtle color accents
 */
export function getZoneStyles(zoneId: string): ZoneStyles {
  const config = getZoneConfig(zoneId);
  const color = config.color;

  return {
    // Subtle left border accent (3px, 30% opacity)
    border: `border-l-4 border-${color}-500/30`,

    // Muted background (5% opacity)
    bg: `bg-${color}-500/5 dark:bg-${color}-500/10`,

    // Text color (readable, not too bright)
    text: `text-${color}-700 dark:text-${color}-300`,

    // Badge styling (solid background with higher opacity)
    badge: `bg-${color}-500/20 text-${color}-700 dark:bg-${color}-500/30 dark:text-${color}-200`,

    // Hover state
    hover: `hover:bg-${color}-500/10 dark:hover:bg-${color}-500/20`,
  };
}

/**
 * Get all zone styles as a safe object for use in components
 * Returns inline styles instead of dynamic Tailwind classes to avoid purging issues
 */
export function getZoneColorScheme(zoneId: string): {
  borderColor: string;
  backgroundColor: string;
  textColor: string;
} {
  const config = getZoneConfig(zoneId);

  // Color mappings for inline styles
  const colorMap: Record<string, { border: string; bg: string; text: string }> = {
    blue: {
      border: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.05)',
      text: '#1d4ed8',
    },
    red: {
      border: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.05)',
      text: '#b91c1c',
    },
    amber: {
      border: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.05)',
      text: '#d97706',
    },
    emerald: {
      border: '#10b981',
      bg: 'rgba(16, 185, 129, 0.05)',
      text: '#047857',
    },
    purple: {
      border: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.05)',
      text: '#7e22ce',
    },
    gray: {
      border: '#6b7280',
      bg: 'rgba(107, 114, 128, 0.05)',
      text: '#4b5563',
    },
  };

  const colors = colorMap[config.color] || colorMap.gray;

  return {
    borderColor: colors.border,
    backgroundColor: colors.bg,
    textColor: colors.text,
  };
}

/**
 * Time Period Configurations
 *
 * Defines morning, afternoon, and night shifts with icons.
 */
export const TIME_PERIODS: TimePeriodConfig[] = [
  {
    id: 'morning',
    label: 'Morning',
    icon: '☀️',
    startHour: 6,
    endHour: 12,
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    icon: '🌤️',
    startHour: 12,
    endHour: 18,
  },
  {
    id: 'night',
    label: 'Night',
    icon: '🌙',
    startHour: 18,
    endHour: 6, // Wraps to next day
  },
];

/**
 * Get time period for a given hour
 */
export function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

/**
 * Get time period configuration by ID
 */
export function getTimePeriodConfig(period: TimePeriod): TimePeriodConfig {
  return TIME_PERIODS.find(p => p.id === period) || TIME_PERIODS[0];
}

/**
 * Parse shift time string to start/end hours
 *
 * @param timeString - Format: "0800-1600" or "08:00-16:00"
 * @returns { start: number, end: number } in 24-hour format
 */
export function parseShiftTime(timeString: string): { start: number; end: number } {
  const cleanTime = timeString.replace(/:/g, '');
  const [startStr, endStr] = cleanTime.split('-');

  const start = parseInt(startStr.substring(0, 2), 10);
  const end = parseInt(endStr.substring(0, 2), 10);

  return { start, end };
}

/**
 * Format shift time for display
 *
 * @param startTime - Format: "0800" or "08:00"
 * @param endTime - Format: "1600" or "16:00"
 * @returns Formatted time like "08:00 - 16:00"
 */
export function formatShiftTime(startTime: string, endTime: string): string {
  const formatTime = (time: string) => {
    const clean = time.replace(/:/g, '');
    const hour = clean.substring(0, 2);
    const minute = clean.substring(2, 4) || '00';
    return `${hour}:${minute}`;
  };

  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Check if a shift is currently active
 */
export function isShiftActive(date: Date, startTime: string, endTime: string): boolean {
  const now = new Date();

  // Check if it's the right day
  const shiftDate = new Date(date);
  const isToday =
    shiftDate.getFullYear() === now.getFullYear() &&
    shiftDate.getMonth() === now.getMonth() &&
    shiftDate.getDate() === now.getDate();

  if (!isToday) return false;

  // Parse shift times
  const { start, end } = parseShiftTime(`${startTime}-${endTime}`);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  const shiftStart = start * 60;
  const shiftEnd = end * 60;

  // Handle overnight shifts
  if (shiftEnd < shiftStart) {
    return currentTime >= shiftStart || currentTime < shiftEnd;
  }

  return currentTime >= shiftStart && currentTime < shiftEnd;
}

/**
 * Site name constants (from Discord bot)
 */
export const SITES = {
  SJ_SCRIBE: 'St Joseph Scribe',
  SJ_PHYSICIAN: 'St Joseph Physician',
  SJ_MLP: 'St Joseph MLP',
} as const;

/**
 * Role constants
 */
export const ROLES = {
  SCRIBE: 'Scribe',
  PHYSICIAN: 'Physician',
  MLP: 'MLP',
} as const;

/**
 * Shift sync interval (milliseconds)
 * Default: 12 hours (matching Discord bot)
 */
export const SYNC_INTERVAL_MS = 12 * 60 * 60 * 1000;

/**
 * Maximum shifts to return in a single query
 */
export const MAX_SHIFTS_PER_QUERY = 1000;
