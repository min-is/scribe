/**
 * ShiftGen Constants
 * Zone mappings and styling for minimalistic Apple-inspired design
 */

import { ZoneConfig } from './types';

/**
 * Zone configurations with minimalistic styling
 * Replaces Discord bot's color emoji system with subtle design
 */
export const ZONE_CONFIGS: Record<string, ZoneConfig> = {
  // Zone 1: B, F, X
  B: {
    id: 'B',
    label: 'Zone 1',
    description: 'Zone 1 - B Shift',
    color: 'blue',
    styles: {
      border: 'border-l-4 border-blue-500/30',
      bg: 'bg-blue-500/5 hover:bg-blue-500/10',
      text: 'text-blue-900 dark:text-blue-100',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    },
  },
  F: {
    id: 'F',
    label: 'Zone 1',
    description: 'Zone 1 - F Shift',
    color: 'blue',
    styles: {
      border: 'border-l-4 border-blue-500/30',
      bg: 'bg-blue-500/5 hover:bg-blue-500/10',
      text: 'text-blue-900 dark:text-blue-100',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    },
  },
  X: {
    id: 'X',
    label: 'Zone 1',
    description: 'Zone 1 - X Shift',
    color: 'blue',
    styles: {
      border: 'border-l-4 border-blue-500/30',
      bg: 'bg-blue-500/5 hover:bg-blue-500/10',
      text: 'text-blue-900 dark:text-blue-100',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    },
  },
  // Zone 2: A, E, I
  A: {
    id: 'A',
    label: 'Zone 2',
    description: 'Zone 2 - A Shift',
    color: 'red',
    styles: {
      border: 'border-l-4 border-red-500/30',
      bg: 'bg-red-500/5 hover:bg-red-500/10',
      text: 'text-red-900 dark:text-red-100',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    },
  },
  E: {
    id: 'E',
    label: 'Zone 2',
    description: 'Zone 2 - E Shift',
    color: 'red',
    styles: {
      border: 'border-l-4 border-red-500/30',
      bg: 'bg-red-500/5 hover:bg-red-500/10',
      text: 'text-red-900 dark:text-red-100',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    },
  },
  I: {
    id: 'I',
    label: 'Zone 2',
    description: 'Zone 2 - I Shift',
    color: 'red',
    styles: {
      border: 'border-l-4 border-red-500/30',
      bg: 'bg-red-500/5 hover:bg-red-500/10',
      text: 'text-red-900 dark:text-red-100',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    },
  },
  // Zones 3/4: C, G
  C: {
    id: 'C',
    label: 'Zones 3/4',
    description: 'Zones 3/4 - C Shift',
    color: 'amber',
    styles: {
      border: 'border-l-4 border-amber-500/30',
      bg: 'bg-amber-500/5 hover:bg-amber-500/10',
      text: 'text-amber-900 dark:text-amber-100',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    },
  },
  G: {
    id: 'G',
    label: 'Zones 3/4',
    description: 'Zones 3/4 - G Shift',
    color: 'amber',
    styles: {
      border: 'border-l-4 border-amber-500/30',
      bg: 'bg-amber-500/5 hover:bg-amber-500/10',
      text: 'text-amber-900 dark:text-amber-100',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    },
  },
  // Zones 5/6: D, H, PA
  D: {
    id: 'D',
    label: 'Zones 5/6',
    description: 'Zones 5/6 - D Shift',
    color: 'emerald',
    styles: {
      border: 'border-l-4 border-emerald-500/30',
      bg: 'bg-emerald-500/5 hover:bg-emerald-500/10',
      text: 'text-emerald-900 dark:text-emerald-100',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
    },
  },
  H: {
    id: 'H',
    label: 'Zones 5/6',
    description: 'Zones 5/6 - H Shift',
    color: 'emerald',
    styles: {
      border: 'border-l-4 border-emerald-500/30',
      bg: 'bg-emerald-500/5 hover:bg-emerald-500/10',
      text: 'text-emerald-900 dark:text-emerald-100',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
    },
  },
  PA: {
    id: 'PA',
    label: 'Zones 5/6',
    description: 'Zones 5/6 - PA Shift',
    color: 'emerald',
    styles: {
      border: 'border-l-4 border-emerald-500/30',
      bg: 'bg-emerald-500/5 hover:bg-emerald-500/10',
      text: 'text-emerald-900 dark:text-emerald-100',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
    },
  },
  // Overflow/PIT
  PIT: {
    id: 'PIT',
    label: 'Overflow/PIT',
    description: 'Overflow/PIT',
    color: 'purple',
    styles: {
      border: 'border-l-4 border-purple-500/30',
      bg: 'bg-purple-500/5 hover:bg-purple-500/10',
      text: 'text-purple-900 dark:text-purple-100',
      badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
    },
  },
};

/**
 * Time period definitions
 */
export const TIME_PERIODS = {
  morning: { start: 6, end: 12, label: 'Morning', icon: '☀️' },
  afternoon: { start: 12, end: 18, label: 'Afternoon', icon: '🌤️' },
  night: { start: 18, end: 6, label: 'Night', icon: '🌙' },
} as const;

/**
 * Get zone configuration by zone ID
 */
export function getZoneConfig(zoneId: string): ZoneConfig {
  return ZONE_CONFIGS[zoneId.toUpperCase()] || ZONE_CONFIGS.A;
}

/**
 * Get zone styling classes
 */
export function getZoneStyles(zoneId: string) {
  const config = getZoneConfig(zoneId);
  return config.styles;
}

/**
 * Map shift zone to zone group for grouping
 */
export function getZoneGroupForShift(zone: string): 'zone1' | 'zone2' | 'zones34' | 'zones56' | 'overflowPit' {
  const zoneUpper = zone.toUpperCase();

  if (['B', 'F', 'X'].includes(zoneUpper)) {
    return 'zone1';
  } else if (['A', 'E', 'I'].includes(zoneUpper)) {
    return 'zone2';
  } else if (['C', 'G'].includes(zoneUpper)) {
    return 'zones34';
  } else if (['D', 'H', 'PA'].includes(zoneUpper)) {
    return 'zones56';
  } else if (zoneUpper === 'PIT') {
    return 'overflowPit';
  }

  // Default to zone1 for unknown zones
  return 'zone1';
}

/**
 * Get display label for zone group
 */
export function getZoneGroupLabel(group: 'zone1' | 'zone2' | 'zones34' | 'zones56' | 'overflowPit'): string {
  const labels = {
    zone1: 'Zone 1',
    zone2: 'Zone 2',
    zones34: 'Zones 3/4',
    zones56: 'Zones 5/6',
    overflowPit: 'Overflow/PIT',
  };
  return labels[group];
}

/**
 * Get shift order within zone (for sorting)
 */
export function getShiftOrderInZone(zone: string): number {
  const order: Record<string, number> = {
    B: 0, F: 1, X: 2,       // Zone 1
    A: 0, E: 1, I: 2,       // Zone 2
    C: 0, G: 1,             // Zones 3/4
    D: 0, H: 1, PA: 2,      // Zones 5/6
    PIT: 0,                 // Overflow/PIT
  };
  return order[zone.toUpperCase()] ?? 99;
}

/**
 * Parse time string (e.g., "0800" -> 8)
 */
export function parseTime(timeStr: string): number {
  const hour = parseInt(timeStr.substring(0, 2), 10);
  return hour;
}

/**
 * Format time string (e.g., "0800" -> "08:00")
 */
export function formatTime(timeStr: string): string {
  const hour = timeStr.substring(0, 2);
  const minute = timeStr.substring(2, 4);
  return `${hour}:${minute}`;
}

/**
 * Format shift time range (e.g., "0800", "1600" -> "08:00 - 16:00")
 */
export function formatShiftTime(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Determine time period from hour
 */
export function getTimePeriod(hour: number): 'morning' | 'afternoon' | 'night' {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

/**
 * Get time period from shift start time
 */
export function getShiftTimePeriod(startTime: string): 'morning' | 'afternoon' | 'night' {
  const hour = parseTime(startTime);
  return getTimePeriod(hour);
}

/**
 * Check if current time is within shift hours
 */
export function isShiftActive(startTime: string, endTime: string): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimeNum = currentHour * 100 + currentMinute;

  const startTimeNum = parseInt(startTime, 10);
  const endTimeNum = parseInt(endTime, 10);

  // Handle overnight shifts
  if (endTimeNum < startTimeNum) {
    return currentTimeNum >= startTimeNum || currentTimeNum <= endTimeNum;
  }

  return currentTimeNum >= startTimeNum && currentTimeNum <= endTimeNum;
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDateFormat(dateStr: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * Validate time format (HHMM)
 */
export function isValidTimeFormat(timeStr: string): boolean {
  return /^\d{4}$/.test(timeStr);
}

/**
 * Normalize a date string (YYYY-MM-DD) to a Date object at UTC midnight
 * This ensures consistent date handling across timezone boundaries
 */
export function parseDateStringToUTC(dateStr: string): Date {
  if (!isValidDateFormat(dateStr)) {
    throw new Error(`Invalid date format: ${dateStr}. Expected: YYYY-MM-DD`);
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  // Create date in UTC to avoid timezone issues
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Normalize a Date object to UTC midnight
 * This strips time components and ensures consistent date-only comparisons
 */
export function normalizeDateToUTC(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0, 0, 0, 0
  ));
}

/**
 * Standard shift definitions
 * Based on user's definitive shift times and zones
 */
interface ShiftDefinition {
  letter: string;
  startTime: string;  // HHMM format
  endTime: string;    // HHMM format
  zone: string;       // Zone label for display
}

export const SHIFT_DEFINITIONS: ShiftDefinition[] = [
  { letter: 'A', startTime: '0530', endTime: '1400', zone: 'Zone 2' },
  { letter: 'B', startTime: '0530', endTime: '1400', zone: 'Zone 1' },
  { letter: 'C', startTime: '0900', endTime: '1800', zone: 'Zones 3/4' },
  { letter: 'D', startTime: '1100', endTime: '1900', zone: 'Zones 5/6' },
  { letter: 'E', startTime: '1330', endTime: '2230', zone: 'Zone 2' },
  { letter: 'F', startTime: '1330', endTime: '2230', zone: 'Zone 1' },
  { letter: 'G', startTime: '1730', endTime: '0230', zone: 'Zones 3/4' },
  { letter: 'H', startTime: '1900', endTime: '0230', zone: 'Zones 5/6' },
  { letter: 'I', startTime: '2200', endTime: '0600', zone: 'Zone 2' },
  { letter: 'X', startTime: '2200', endTime: '0600', zone: 'Zone 1' },
  { letter: 'PIT', startTime: '1230', endTime: '2030', zone: 'Overflow/PIT' },
];

/**
 * Normalize time to 4-digit format (e.g., "800" -> "0800", "1400" -> "1400")
 */
function normalizeTimeFormat(time: string): string {
  return time.padStart(4, '0');
}

/**
 * Determine shift letter from start time and zone
 * This helps match shifts even when labels differ between scribe/provider schedules
 */
export function getShiftLetterFromTime(startTime: string, rawLabel?: string): string | null {
  const normalizedStart = normalizeTimeFormat(startTime);

  // Special case: PA shifts can have multiple start times
  if (rawLabel?.toUpperCase().includes('PA') || rawLabel?.toUpperCase().includes('MLP')) {
    return 'PA';
  }

  // Special case: PIT shift
  if (normalizedStart === '1230') {
    return 'PIT';
  }

  // Try to match by start time alone first
  const matchingShifts = SHIFT_DEFINITIONS.filter(def => def.startTime === normalizedStart);

  if (matchingShifts.length === 1) {
    return matchingShifts[0].letter;
  }

  // If multiple shifts have same start time, try to use the label to disambiguate
  if (matchingShifts.length > 1 && rawLabel) {
    const labelUpper = rawLabel.toUpperCase();

    // Try exact letter match first
    const exactMatch = matchingShifts.find(def => labelUpper.includes(def.letter));
    if (exactMatch) {
      return exactMatch.letter;
    }

    // Try zone-based matching
    for (const def of matchingShifts) {
      if (labelUpper.includes('ZONE 1') || labelUpper.includes('ZONE1')) {
        if (def.zone === 'Zone 1') return def.letter;
      }
      if (labelUpper.includes('ZONE 2') || labelUpper.includes('ZONE2')) {
        if (def.zone === 'Zone 2') return def.letter;
      }
    }
  }

  // Fallback: return first match if we have one
  return matchingShifts.length > 0 ? matchingShifts[0].letter : null;
}

/**
 * Get zone from shift letter
 */
export function getZoneFromShiftLetter(shiftLetter: string): string {
  const shift = SHIFT_DEFINITIONS.find(def => def.letter.toUpperCase() === shiftLetter.toUpperCase());
  return shift ? shift.letter : shiftLetter;
}
