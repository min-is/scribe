/**
 * ShiftGen Type Definitions
 * Standalone schedule viewer for the website
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
 * Time period for grouping shifts (deprecated, keeping for backwards compatibility)
 */
export type TimePeriod = 'morning' | 'afternoon' | 'night';

/**
 * Zone-based grouping for ED zones
 */
export type ZoneGroup = 'zone1' | 'zone2' | 'zones34' | 'zones56' | 'overflowPit';

/**
 * Shifts grouped by time period (deprecated)
 */
export type GroupedShifts = {
  morning: ShiftWithRelations[];
  afternoon: ShiftWithRelations[];
  night: ShiftWithRelations[];
};

/**
 * Shifts grouped by ED zone
 */
export type ZoneGroupedShifts = {
  zone1: ShiftWithRelations[];      // A, E, I
  zone2: ShiftWithRelations[];      // B, F, X
  zones34: ShiftWithRelations[];    // C, G
  zones56: ShiftWithRelations[];    // D, H, PA
  overflowPit: ShiftWithRelations[]; // PIT
};

/**
 * Daily schedule with summary
 */
export type DailySchedule = {
  date: Date;
  shifts: GroupedShifts | ZoneGroupedShifts;
  summary: {
    totalShifts: number;
    uniqueScribes: number;
    uniqueProviders: number;
    zonesCovered: string[];
  };
};

/**
 * Currently active shifts
 */
export type CurrentShifts = {
  active: ShiftWithRelations[];
  count: number;
  timestamp: Date;
};

/**
 * Zone configuration
 */
export type ZoneConfig = {
  id: string;
  label: string;
  description: string;
  color: string;
  styles: {
    border: string;
    bg: string;
    text: string;
    badge: string;
  };
};

/**
 * Shift query filters
 */
export type ShiftFilters = {
  zone?: string;
  scribeId?: string;
  providerId?: string;
  site?: string;
  startDate?: Date;
  endDate?: Date;
};

/**
 * Standardized API response wrapper
 */
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
};
