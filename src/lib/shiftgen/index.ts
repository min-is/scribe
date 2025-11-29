/**
 * ShiftGen Integration Library
 *
 * Main entry point for shift scheduling features.
 *
 * @module shiftgen
 */

// Re-export types
export type {
  ShiftWithRelations,
  GroupedShifts,
  DailySchedule,
  CurrentShifts,
  ScraperShiftData,
  ShiftIngestPayload,
  SyncSummary,
  ShiftChange,
  ZoneConfig,
  ZoneStyles,
  ApiResponse,
  ShiftQueryParams,
  TimePeriod,
  TimePeriodConfig,
} from './types';

// Re-export constants
export {
  ZONE_CONFIGS,
  TIME_PERIODS,
  SITES,
  ROLES,
  SYNC_INTERVAL_MS,
  MAX_SHIFTS_PER_QUERY,
  getZoneConfig,
  getZoneStyles,
  getZoneColorScheme,
  getTimePeriod,
  getTimePeriodConfig,
  parseShiftTime,
  formatShiftTime,
  isShiftActive,
} from './constants';

// Re-export database utilities
export {
  getShiftsForDate,
  getShiftsInRange,
  getCurrentShifts,
  getDailySchedule,
  findOrCreateScribe,
  findProviderByName,
  upsertShift,
  syncShiftsFromScraper,
  detectChanges,
  cleanupOldShifts,
  getAllScribes,
  getScribeWithShifts,
} from './db';

// Re-export validators (will be created next)
export {
  validateShiftData,
  validateShiftQueryParams,
  validateDateString,
  validateTimeString,
} from './validators';
