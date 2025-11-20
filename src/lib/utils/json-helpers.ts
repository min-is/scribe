/**
 * JSON Helpers for Prisma JSON Type Conversions
 * Handles type-safe conversions between TypeScript types and Prisma's InputJsonValue
 */

import { Prisma } from '@prisma/client';

/**
 * Converts any value to Prisma's InputJsonValue type
 * This is necessary because Prisma's JSON type requires specific index signatures
 */
export function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }

  // Serialize and deserialize to ensure it conforms to JSON structure
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Safely extracts a typed value from Prisma's JsonValue
 */
export function fromJsonValue<T>(value: Prisma.JsonValue | null): T | null {
  if (value === null || value === Prisma.JsonNull) {
    return null;
  }

  return value as T;
}

/**
 * Type guard to check if a value is a valid JSON value
 */
export function isValidJsonValue(value: unknown): value is Prisma.JsonValue {
  if (value === null) return true;
  if (typeof value === 'string') return true;
  if (typeof value === 'number') return true;
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) {
    return value.every(isValidJsonValue);
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).every(isValidJsonValue);
  }
  return false;
}
