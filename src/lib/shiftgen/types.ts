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
 * Time period for grouping shifts
 */
export type TimePeriod = 'morning' | 'afternoon' | 'night';

/**
 * Shifts grouped by time period
 */
export type GroupedShifts = {
  morning: ShiftWithRelations[];
  afternoon: ShiftWithRelations[];
  night: ShiftWithRelations[];
};

/**
 * Daily schedule with summary
 */
export type DailySchedule = {
  date: Date;
  shifts: GroupedShifts;
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
