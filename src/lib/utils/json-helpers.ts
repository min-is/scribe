/**
 * JSON Helpers for Prisma Type Conversions
 *
 * Provides utilities to convert between TypeScript types and Prisma's InputJsonValue type.
 * This is necessary because Prisma's JSON types have specific requirements that don't
 * always match our TypeScript interfaces (e.g., WikiContent needs an index signature).
 */

import { Prisma } from '@prisma/client';

/**
 * Converts any TypeScript value to Prisma's InputJsonValue type.
 * This handles the type conversion by serializing and deserializing the value.
 *
 * @param value - Any TypeScript value to convert
 * @returns A value compatible with Prisma's InputJsonValue type
 */
export function toInputJsonValue<T>(value: T): Prisma.InputJsonValue {
  if (value === null) {
    return Prisma.JsonNull;
  }
  if (value === undefined) {
    return Prisma.JsonNull;
  }
  // Serialize and deserialize to ensure compatibility
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Safely extracts a typed value from Prisma's JsonValue.
 * Performs runtime type checking to ensure the value matches the expected type.
 *
 * @param value - The Prisma JsonValue to extract from
 * @param validator - Optional validator function to check the type
 * @returns The typed value, or null if invalid
 */
export function fromJsonValue<T>(
  value: Prisma.JsonValue | null | undefined,
  validator?: (val: unknown) => val is T,
): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (validator && !validator(value)) {
    return null;
  }

  return value as T;
}

/**
 * Type guard to check if a value is a valid JSON value.
 *
 * @param value - Value to check
 * @returns True if the value is a valid JSON value
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
