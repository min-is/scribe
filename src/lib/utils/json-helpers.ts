/**
 * JSON Type Helpers
 *
 * Utilities for handling Prisma Json types and TypeScript type conversions
 */

import { Prisma } from '@prisma/client';

/**
 * Converts any value to Prisma's InputJsonValue type
 * This is necessary because Prisma requires index signatures for JSON types
 */
export function toInputJsonValue<T>(value: T): Prisma.InputJsonValue {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }

  // For objects and arrays, we need to serialize and parse to ensure
  // they conform to Prisma's Json requirements
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Safely parse JSON from Prisma Json type
 */
export function fromJsonValue<T>(value: unknown): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  // Prisma Json types are already parsed, so we just need to cast
  return value as T;
}

/**
 * Type guard to check if a value is a valid JSON value
 */
export function isValidJsonValue(value: unknown): value is Prisma.JsonValue {
  if (value === null) return true;

  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isValidJsonValue);
  }

  if (type === 'object') {
    return Object.values(value as Record<string, unknown>).every(isValidJsonValue);
  }

  return false;
}
