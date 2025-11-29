/**
 * ShiftGen Type Definitions
 *
 * TypeScript types for shift scheduling, data ingestion, and UI components.
 */

import { Shift, Scribe, Provider } from '@prisma/client';

/**
 * Shift with related scribe and provider data
 */
export type ShiftWithRelations = Shift & {
  scribe: Scribe | null;
  provider: Provider | null;
};

/**
 * Shifts grouped by time period (morning, afternoon, night)
 */
export interface GroupedShifts {
  morning: ShiftWithRelations[];
  afternoon: ShiftWithRelations[];
  night: ShiftWithRelations[];
}

/**
 * Complete daily schedule with metadata
 */
export interface DailySchedule {
  date: Date;
  shifts: ShiftWithRelations[];
  grouped: GroupedShifts;
  summary: {
    totalShifts: number;
    scribesWorking: number;
    providersWorking: number;
    zones: string[];
  };
}

/**
 * Currently active shifts (for "who's working now" feature)
 */
export interface CurrentShifts {
  timestamp: Date;
  activeShifts: ShiftWithRelations[];
  count: number;
}

/**
 * Shift data format from Python scraper (Discord bot)
 */
export interface ScraperShiftData {
  date: string;          // "YYYY-MM-DD"
  label: string;         // Zone identifier (A, B, C, PA, FT, etc.)
  time: string;          // "0800-1600"
  person: string;        // Name of scribe or provider
  role: 'Scribe' | 'Physician' | 'MLP';
  site: string;          // Site name
}

/**
 * Batch import payload from Python scraper
 */
export interface ShiftIngestPayload {
  shifts: ScraperShiftData[];
  source?: string;       // "discord-bot" | "manual" | etc.
  timestamp?: string;    // ISO timestamp of scrape
}

/**
 * Result of shift ingestion/sync operation
 */
export interface SyncSummary {
  success: boolean;
  timestamp: Date;
  stats: {
    total: number;
    created: number;
    updated: number;
    unchanged: number;
    errors: number;
  };
  changes?: ShiftChange[];
  errors?: Array<{
    shift: ScraperShiftData;
    error: string;
  }>;
}

/**
 * Change detection for shift updates
 */
export interface ShiftChange {
  type: 'added' | 'modified' | 'removed';
  date: string;
  zone: string;
  time: string;
  before?: {
    scribe?: string;
    provider?: string;
  };
  after?: {
    scribe?: string;
    provider?: string;
  };
}

/**
 * Zone configuration for UI styling
 */
export interface ZoneConfig {
  id: string;              // Zone identifier (A, B, C, etc.)
  name: string;            // Display name ("Zone 1", "Zone 2", etc.)
  color: string;           // Color name for Tailwind classes
  description?: string;    // Optional description
}

/**
 * Zone styling classes (Tailwind CSS)
 */
export interface ZoneStyles {
  border: string;          // Border color class
  bg: string;              // Background color class
  text: string;            // Text color class
  badge: string;           // Badge color classes
  hover?: string;          // Hover state class
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Shift query parameters
 */
export interface ShiftQueryParams {
  date?: string;           // "YYYY-MM-DD"
  startDate?: string;      // For range queries
  endDate?: string;        // For range queries
  zone?: string;           // Filter by zone
  scribeId?: string;       // Filter by scribe
  providerId?: string;     // Filter by provider
  site?: string;           // Filter by site
}

/**
 * Time period for grouping shifts
 */
export type TimePeriod = 'morning' | 'afternoon' | 'night';

/**
 * Time period configuration
 */
export interface TimePeriodConfig {
  id: TimePeriod;
  label: string;
  icon: string;
  startHour: number;       // 24-hour format
  endHour: number;         // 24-hour format
}
