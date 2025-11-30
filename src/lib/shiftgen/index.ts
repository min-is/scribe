/**
 * ShiftGen Library - Main Entry Point
 * Standalone schedule viewer for the website
 */

// Types
export type {
  ShiftWithRelations,
  TimePeriod,
  GroupedShifts,
  DailySchedule,
  CurrentShifts,
  ZoneConfig,
  ShiftFilters,
  ApiResponse,
} from './types';

// Constants and utilities
export {
  ZONE_CONFIGS,
  TIME_PERIODS,
  getZoneConfig,
  getZoneStyles,
  parseTime,
  formatTime,
  formatShiftTime,
  getTimePeriod,
  getShiftTimePeriod,
  isShiftActive,
  isValidDateFormat,
  isValidTimeFormat,
} from './constants';

// Database operations
export {
  getShiftsForDate,
  getShiftsInRange,
  getCurrentShifts,
  getDailySchedule,
  findScribeByName,
  findProviderByName,
  createShift,
  updateShift,
  deleteShift,
  deleteShiftsForDate,
  findOrCreateScribe,
  upsertShift,
  getAllScribes,
  getShiftsByScribe,
  getShiftsByProvider,
} from './db';

// Scraping and sync
export { ShiftGenScraper } from './scraper';
export { ScheduleParser } from './parser';
export type { RawShiftData } from './parser';
export { NameMapper } from './name-mapper';
export { ShiftGenSyncService } from './sync';
export type { SyncResult } from './sync';
export { SITES_TO_FETCH, BASE_URL } from './config';
