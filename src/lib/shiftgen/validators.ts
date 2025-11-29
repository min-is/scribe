/**
 * ShiftGen Validators
 *
 * Input validation and sanitization for shift data and API requests.
 */

import { ScraperShiftData, ShiftQueryParams } from './types';
import { ROLES } from './constants';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate scraper shift data
 */
export function validateShiftData(data: any): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!data.date) errors.push('Missing required field: date');
  if (!data.label) errors.push('Missing required field: label (zone)');
  if (!data.time) errors.push('Missing required field: time');
  if (!data.person) errors.push('Missing required field: person');
  if (!data.role) errors.push('Missing required field: role');
  if (!data.site) errors.push('Missing required field: site');

  // Validate date format (YYYY-MM-DD)
  if (data.date && !validateDateString(data.date).valid) {
    errors.push('Invalid date format. Expected YYYY-MM-DD');
  }

  // Validate time format (HHMM-HHMM)
  if (data.time && !validateTimeString(data.time).valid) {
    errors.push('Invalid time format. Expected HHMM-HHMM or HH:MM-HH:MM');
  }

  // Validate role
  if (data.role && !Object.values(ROLES).includes(data.role)) {
    errors.push(`Invalid role. Expected one of: ${Object.values(ROLES).join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate shift query parameters
 */
export function validateShiftQueryParams(params: any): ValidationResult {
  const errors: string[] = [];

  // Validate date if provided
  if (params.date && !validateDateString(params.date).valid) {
    errors.push('Invalid date format. Expected YYYY-MM-DD');
  }

  // Validate date range if provided
  if (params.startDate && !validateDateString(params.startDate).valid) {
    errors.push('Invalid startDate format. Expected YYYY-MM-DD');
  }

  if (params.endDate && !validateDateString(params.endDate).valid) {
    errors.push('Invalid endDate format. Expected YYYY-MM-DD');
  }

  // Ensure startDate < endDate if both provided
  if (params.startDate && params.endDate) {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    if (start > end) {
      errors.push('startDate must be before endDate');
    }

    // Limit range to prevent excessive queries
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 90) {
      errors.push('Date range cannot exceed 90 days');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate date string (YYYY-MM-DD)
 */
export function validateDateString(dateStr: string): ValidationResult {
  const errors: string[] = [];

  // Check format
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(dateStr)) {
    errors.push('Date must be in YYYY-MM-DD format');
    return { valid: false, errors };
  }

  // Check if valid date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    errors.push('Invalid date');
    return { valid: false, errors };
  }

  // Check if date matches input (handles invalid dates like 2023-02-30)
  const [year, month, day] = dateStr.split('-').map(Number);
  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    errors.push('Invalid date');
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

/**
 * Validate time string (HHMM-HHMM or HH:MM-HH:MM)
 */
export function validateTimeString(timeStr: string): ValidationResult {
  const errors: string[] = [];

  // Remove colons for consistent validation
  const cleanTime = timeStr.replace(/:/g, '');

  // Check format (HHMM-HHMM)
  const timePattern = /^\d{4}-\d{4}$/;
  if (!timePattern.test(cleanTime)) {
    errors.push('Time must be in HHMM-HHMM or HH:MM-HH:MM format');
    return { valid: false, errors };
  }

  // Extract hours and minutes
  const [startStr, endStr] = cleanTime.split('-');
  const startHour = parseInt(startStr.substring(0, 2), 10);
  const startMin = parseInt(startStr.substring(2, 4), 10);
  const endHour = parseInt(endStr.substring(0, 2), 10);
  const endMin = parseInt(endStr.substring(2, 4), 10);

  // Validate ranges
  if (startHour < 0 || startHour > 23) {
    errors.push('Start hour must be between 00 and 23');
  }
  if (endHour < 0 || endHour > 23) {
    errors.push('End hour must be between 00 and 23');
  }
  if (startMin < 0 || startMin > 59) {
    errors.push('Start minute must be between 00 and 59');
  }
  if (endMin < 0 || endMin > 59) {
    errors.push('End minute must be between 00 and 59');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize shift data (trim strings, normalize formats)
 */
export function sanitizeShiftData(data: ScraperShiftData): ScraperShiftData {
  return {
    date: data.date.trim(),
    label: data.label.trim().toUpperCase(),
    time: data.time.replace(/:/g, '').trim(), // Normalize to HHMM-HHMM
    person: data.person.trim(),
    role: data.role,
    site: data.site.trim(),
  };
}
