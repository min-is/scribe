import { Prisma } from '@prisma/client';

/**
 * Converts any value to Prisma's InputJsonValue type
 * This ensures compatibility with Prisma's JSON field requirements
 */
export function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }

  // Serialize and deserialize to ensure the object structure is compatible
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

/**
 * Safely extracts a typed value from Prisma's JsonValue
 */
export function fromJsonValue<T>(value: Prisma.JsonValue | null | undefined): T | null {
  if (value === null || value === undefined || value === Prisma.JsonNull) {
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
