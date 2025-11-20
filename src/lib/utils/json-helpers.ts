/**
 * JSON Helpers for Prisma JSON Type Compatibility
 *
 * Prisma's InputJsonValue type has strict requirements that TypeScript interfaces
 * may not satisfy. These helpers ensure proper type conversion.
 */

import { Prisma } from '@prisma/client';

/**
 * Converts any value to Prisma's InputJsonValue type
 * This is necessary because TypeScript interfaces without index signatures
 * cannot be directly assigned to InputJsonValue
 */
export function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === null) return Prisma.JsonNull;
  if (value === undefined) return Prisma.JsonNull;

  // Serialize and deserialize to ensure compatibility
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Safely extracts a typed value from Prisma's JsonValue
 * Returns null if the value is JsonNull or invalid
 */
export function fromJsonValue<T>(value: Prisma.JsonValue | null): T | null {
  if (value === null || value === Prisma.JsonNull) return null;

  try {
    // JsonValue is already a valid JS type, just cast it
    return value as T;
  } catch {
    return null;
  }
}

/**
 * Type guard to check if a value is a valid JSON value
 */
export function isValidJsonValue(value: unknown): value is Prisma.JsonValue {
  if (value === null) return true;
  if (value === undefined) return false;

  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') return true;
  if (Array.isArray(value)) return value.every(isValidJsonValue);
  if (type === 'object') {
    return Object.values(value as object).every(isValidJsonValue);
  }

  return false;
}
