/**
 * JSON Type Helpers
 *
 * Utilities for working with Prisma's JSON types.
 * Handles conversion between TypeScript types and Prisma's InputJsonValue.
 */

import { Prisma } from '@prisma/client';

/**
 * Converts a value to Prisma's InputJsonValue type.
 * Uses Prisma.JsonNull for null values to satisfy Prisma's type requirements.
 */
export function toInputJsonValue<T>(value: T): Prisma.InputJsonValue {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }

  // For objects and arrays, serialize and parse to ensure compatibility
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Safely extracts a typed value from Prisma's JsonValue.
 */
export function fromJsonValue<T>(value: Prisma.JsonValue | null | undefined): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value as T;
}

/**
 * Type guard to check if a value is a valid JSON value.
 */
export function isValidJsonValue(value: unknown): value is Prisma.InputJsonValue {
  if (value === null || value === undefined) {
    return true;
  }

  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isValidJsonValue);
  }

  if (type === 'object') {
    return Object.values(value as object).every(isValidJsonValue);
  }

  return false;
}
