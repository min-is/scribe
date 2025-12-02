/**
 * ShiftGen Library - Main Entry Point
 * Standalone schedule viewer for the website
 */

// Types (safe for client and server)
export type {
  ShiftWithRelations,
  TimePeriod,
  GroupedShifts,
  ZoneGroupedShifts,
  ZoneGroup,
  DailySchedule,
  CurrentShifts,
  ZoneConfig,
  ShiftFilters,
  ApiResponse,
} from './types';

// Constants and utilities (safe for client and server)
export {
  ZONE_CONFIGS,
  TIME_PERIODS,
  getZoneConfig,
  getZoneStyles,
  getZoneGroupForShift,
  getZoneGroupLabel,
  getShiftOrderInZone,
  parseTime,
  formatTime,
  formatShiftTime,
  getTimePeriod,
  getShiftTimePeriod,
  isShiftActive,
  isValidDateFormat,
  isValidTimeFormat,
} from './constants';

// Database operations (safe for server-side only, but exported for API routes)
export {
  getShiftsForDate,
  getShiftsInRange,
  getCurrentShifts,
  getDailySchedule,
  getDailyScheduleByZone,
  findScribeByName,
  findProviderByName,
  createShift,
  updateShift,
  deleteShift,
  deleteShiftsForDate,
  findOrCreateScribe,
  findOrCreateProvider,
  upsertShift,
  getAllScribes,
  getShiftsByScribe,
  getShiftsByProvider,
  cleanDuplicateShifts,
  resetDatabase,
  getDatabaseStats,
} from './db';

// Server-only exports (contain Node.js dependencies like 'fs')
// Import these directly from their modules in API routes:
// import { ShiftGenScraper } from '@/lib/shiftgen/scraper'
// import { ScheduleParser } from '@/lib/shiftgen/parser'
// import { NameMapper } from '@/lib/shiftgen/name-mapper'
// import { ShiftGenSyncService } from '@/lib/shiftgen/sync'
