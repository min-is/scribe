/**
 * TypeScript types for ShiftGen integration
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
 * Grouped shifts by time period
 */
export type GroupedShifts = {
  morning: ShiftWithRelations[];
  afternoon: ShiftWithRelations[];
  night: ShiftWithRelations[];
};

/**
 * Daily schedule summary
 */
export type DailySchedule = {
  date: string; // YYYY-MM-DD format
  shifts: GroupedShifts;
  totalShifts: number;
};

/**
 * Currently working shifts
 */
export type CurrentShifts = {
  shifts: ShiftWithRelations[];
  timestamp: string;
};

/**
 * Shift data from Python scraper (legacy format)
 */
export type ScraperShiftData = {
  date: string; // YYYY-MM-DD
  label: string; // Zone (A, B, C, PA, etc.)
  time: string; // e.g., "0800-1600"
  person: string; // Name
  role: 'Scribe' | 'Physician' | 'MLP';
  site: string;
};

/**
 * Shift change detection result
 */
export type ShiftChange = {
  type: 'added' | 'removed' | 'modified';
  date: string;
  zone: string;
  old?: {
    scribe?: string;
    provider?: string;
    time?: string;
  };
  new?: {
    scribe?: string;
    provider?: string;
    time?: string;
  };
};

/**
 * Sync summary from data refresh
 */
export type SyncSummary = {
  success: boolean;
  timestamp: string;
  shiftsProcessed: number;
  shiftsAdded: number;
  shiftsModified: number;
  shiftsRemoved: number;
  changes: ShiftChange[];
  errors?: string[];
};

/**
 * Zone color type
 */
export type ZoneColor = 'blue' | 'red' | 'amber' | 'purple' | 'emerald' | 'stone';

/**
 * Time period type
 */
export type TimePeriod = 'MORNING' | 'AFTERNOON' | 'NIGHT';
