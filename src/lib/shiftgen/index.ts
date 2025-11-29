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
  getAllScribes,
  getShiftsByScribe,
  getShiftsByProvider,
} from './db';
