/**
 * Fractional Indexing Utilities
 *
 * Provides utilities for generating fractional indexes for ordering pages.
 * Uses fractional-indexing-jittered for stable, collision-resistant ordering.
 */

import { generateJitteredKeyBetween } from 'fractional-indexing-jittered';

/**
 * Generate a position before a given position
 */
export function getPositionBefore(position: string | null): string {
  return generateJitteredKeyBetween(null, position);
}

/**
 * Generate a position after a given position
 */
export function getPositionAfter(position: string | null): string {
  return generateJitteredKeyBetween(position, null);
}

/**
 * Generate a position between two positions
 */
export function getPositionBetween(
  before: string | null,
  after: string | null
): string {
  return generateJitteredKeyBetween(before, after);
}

/**
 * Generate the first position (for the first item in a list)
 */
export function getFirstPosition(): string {
  return 'a0';
}

/**
 * Sort an array by position field
 */
export function sortByPosition<T extends { position: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.position.localeCompare(b.position));
}
