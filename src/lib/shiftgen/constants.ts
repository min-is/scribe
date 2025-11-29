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
  A: {
    id: 'A',
    label: 'Zone 1',
    description: 'Zone 1 (Blue)',
    color: 'blue',
    styles: {
      border: 'border-l-4 border-blue-500/30',
      bg: 'bg-blue-500/5 hover:bg-blue-500/10',
      text: 'text-blue-900 dark:text-blue-100',
      badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    },
  },
  B: {
    id: 'B',
    label: 'Zone 2',
    description: 'Zone 2 (Red)',
    color: 'red',
    styles: {
      border: 'border-l-4 border-red-500/30',
      bg: 'bg-red-500/5 hover:bg-red-500/10',
      text: 'text-red-900 dark:text-red-100',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    },
  },
  C: {
    id: 'C',
    label: 'Zone 3/4',
    description: 'Zone 3/4 (Amber)',
    color: 'amber',
    styles: {
      border: 'border-l-4 border-amber-500/30',
      bg: 'bg-amber-500/5 hover:bg-amber-500/10',
      text: 'text-amber-900 dark:text-amber-100',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
    },
  },
  PA: {
    id: 'PA',
    label: 'PA/NP',
    description: 'PA/NP (Emerald)',
    color: 'emerald',
    styles: {
      border: 'border-l-4 border-emerald-500/30',
      bg: 'bg-emerald-500/5 hover:bg-emerald-500/10',
      text: 'text-emerald-900 dark:text-emerald-100',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
    },
  },
  FT: {
    id: 'FT',
    label: 'Fast Track',
    description: 'Fast Track (Purple)',
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
