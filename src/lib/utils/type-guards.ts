/**
 * Type Guards for Runtime Validation
 *
 * Provides type guards and validation functions for WikiContent and TipTap content.
 * These help ensure data integrity by validating JSON structures at runtime.
 */

import { JSONContent } from '@tiptap/core';
import { WikiContent, WikiSection, MediaItem } from '@/provider/wiki-schema';

/**
 * Type guard to check if a value is valid WikiContent.
 *
 * @param obj - Value to check
 * @returns True if the value is WikiContent
 */
export function isWikiContent(obj: unknown): obj is WikiContent {
  if (!obj || typeof obj !== 'object') return false;

  const wiki = obj as WikiContent;

  return (
    typeof wiki.version === 'number' &&
    Array.isArray(wiki.sections) &&
    Array.isArray(wiki.media) &&
    typeof wiki.metadata === 'object' &&
    wiki.metadata !== null &&
    typeof wiki.metadata.lastEditedAt === 'string' &&
    typeof wiki.metadata.totalEdits === 'number'
  );
}

/**
 * Type guard to check if a value is valid TipTap JSON content.
 *
 * @param obj - Value to check
 * @returns True if the value is valid TipTap content
 */
export function isTipTapContent(obj: unknown): obj is JSONContent {
  if (!obj || typeof obj !== 'object') return false;

  const content = obj as JSONContent;

  // Must have a type property
  if (typeof content.type !== 'string') return false;

  // If it has content, it must be an array
  if (content.content !== undefined && !Array.isArray(content.content)) {
    return false;
  }

  return true;
}

/**
 * Validates TipTap content structure deeply.
 * Checks for common issues and returns error messages.
 *
 * @param content - Content to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateTipTapContent(content: unknown): {
  isValid: boolean;
  error?: string;
} {
  if (!content) {
    return { isValid: false, error: 'Content is null or undefined' };
  }

  if (typeof content !== 'object') {
    return { isValid: false, error: 'Content must be an object' };
  }

  const json = content as JSONContent;

  if (!json.type || typeof json.type !== 'string') {
    return { isValid: false, error: 'Content must have a string type property' };
  }

  // Root node should be 'doc'
  if (json.type === 'doc') {
    if (!json.content || !Array.isArray(json.content)) {
      return { isValid: false, error: 'Doc node must have a content array' };
    }

    // Validate each child node recursively
    for (let i = 0; i < json.content.length; i++) {
      const child = json.content[i];
      const childValidation = validateTipTapContent(child);
      if (!childValidation.isValid) {
        return {
          isValid: false,
          error: `Invalid child at index ${i}: ${childValidation.error}`,
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Detects if page content is corrupted (e.g., from JSON.stringify bug).
 * Looks for signs that the content is a stringified WikiContent object
 * instead of proper TipTap JSON.
 *
 * @param content - Content to check
 * @returns True if the content appears to be corrupted
 */
export function isCorruptedPageContent(content: unknown): boolean {
  if (!content || typeof content !== 'object') return false;

  const json = content as Record<string, unknown>;

  // Check for WikiContent structure in page content (indicates JSON.stringify bug)
  if (
    json.version !== undefined &&
    json.sections !== undefined &&
    json.media !== undefined &&
    json.metadata !== undefined
  ) {
    return true;
  }

  return false;
}

/**
 * Safely parses WikiContent from unknown value.
 * Returns null if the value is not valid WikiContent.
 *
 * @param value - Value to parse
 * @returns Parsed WikiContent or null
 */
export function parseWikiContent(value: unknown): WikiContent | null {
  if (!value) return null;

  // If it's a string, try to parse it
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  return isWikiContent(value) ? value : null;
}

/**
 * Safely parses TipTap content from unknown value.
 * Returns null if the value is not valid TipTap content.
 *
 * @param value - Value to parse
 * @returns Parsed TipTap content or null
 */
export function parseTipTapContent(value: unknown): JSONContent | null {
  if (!value) return null;

  // If it's a string, try to parse it
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  return isTipTapContent(value) ? value : null;
}
