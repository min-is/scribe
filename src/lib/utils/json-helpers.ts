/**
 * JSON Helpers for Prisma Type Conversions
 *
 * Handles conversion between TypeScript types and Prisma's InputJsonValue type.
 */

import { Prisma } from '@prisma/client';

/**
 * Converts any TypeScript value to Prisma's InputJsonValue type
 * This ensures type compatibility with Prisma's Json fields
 */
export function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }

  // Serialize and deserialize to ensure the object conforms to JSON requirements
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Safely extracts typed data from Prisma JSON values
 */
export function fromJsonValue<T>(value: unknown): T | null {
  if (value === null || value === undefined) {
    return null;
  }

  return value as T;
}

/**
 * Type guard to check if a value is a valid JSON value
 */
export function isValidJsonValue(value: unknown): value is Prisma.InputJsonValue {
  if (value === null || value === undefined) return true;

  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') return true;

  if (Array.isArray(value)) {
    return value.every(isValidJsonValue);
  }

  if (type === 'object') {
    return Object.values(value as object).every(isValidJsonValue);
  }

  return false;
}
