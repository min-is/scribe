import { JSONContent } from '@tiptap/core';
import type { WikiContent, WikiSection } from './dtos/provider.dto';

/**
 * Type Guards
 *
 * Runtime type validation for JSON content.
 * Replaces unsafe `as any` casts with proper type checking.
 */

/**
 * Check if value is valid TipTap content
 */
export function isTipTapContent(value: unknown): value is JSONContent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const content = value as any;

  // Must have type: "doc"
  if (content.type !== 'doc') {
    return false;
  }

  // Must have content array
  if (!Array.isArray(content.content)) {
    return false;
  }

  return true;
}

/**
 * Check if value is valid WikiContent
 */
export function isWikiContent(value: unknown): value is WikiContent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const wiki = value as any;

  // Must have version number
  if (typeof wiki.version !== 'number') {
    return false;
  }

  // Must have sections array
  if (!Array.isArray(wiki.sections)) {
    return false;
  }

  // Must have media array
  if (!Array.isArray(wiki.media)) {
    return false;
  }

  // Must have metadata object
  if (!wiki.metadata || typeof wiki.metadata !== 'object') {
    return false;
  }

  return true;
}

/**
 * Check if value is valid WikiSection
 */
export function isWikiSection(value: unknown): value is WikiSection {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as any;

  return (
    typeof section.id === 'string' &&
    typeof section.type === 'string' &&
    typeof section.order === 'number' &&
    typeof section.title === 'string' &&
    isTipTapContent(section.content) &&
    typeof section.visible === 'boolean'
  );
}

/**
 * Validate TipTap content with detailed error messages
 */
export function validateTipTapContent(
  value: unknown
): { valid: boolean; error?: string } {
  if (!value) {
    return { valid: false, error: 'Content is null or undefined' };
  }

  if (typeof value !== 'object') {
    return { valid: false, error: 'Content must be an object' };
  }

  const content = value as any;

  if (content.type !== 'doc') {
    return {
      valid: false,
      error: `Content type must be "doc", got "${content.type}"`,
    };
  }

  if (!Array.isArray(content.content)) {
    return { valid: false, error: 'Content.content must be an array' };
  }

  return { valid: true };
}

/**
 * Detect corrupted page content (from JSON.stringify bug)
 * Returns true if content appears to be stringified WikiContent
 */
export function isCorruptedPageContent(value: unknown): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const content = value as any;

  // Check if it's a stringified WikiContent object
  // (has media, version, sections, metadata at root level instead of nested in content)
  if (
    content.type === 'doc' &&
    Array.isArray(content.content) &&
    content.content.length === 1
  ) {
    const firstNode = content.content[0];

    // Check if the text looks like stringified JSON
    if (
      firstNode.type === 'paragraph' &&
      firstNode.content?.[0]?.type === 'text'
    ) {
      const text = firstNode.content[0].text;
      if (
        text &&
        typeof text === 'string' &&
        (text.includes('"media":') || text.includes('"version":'))
      ) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Safely parse JSON content
 * Returns null if invalid
 */
export function parseTipTapContent(value: unknown): JSONContent | null {
  if (isTipTapContent(value)) {
    return value as JSONContent;
  }

  // Try to parse if it's a string
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (isTipTapContent(parsed)) {
        return parsed;
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Safely parse WikiContent
 * Returns null if invalid
 */
export function parseWikiContent(value: unknown): WikiContent | null {
  if (isWikiContent(value)) {
    return value as WikiContent;
  }

  // Try to parse if it's a string
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (isWikiContent(parsed)) {
        return parsed;
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Check if Prisma JSON field contains valid data
 */
export function isValidJsonField(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true; // Nullable fields are valid
  }

  if (typeof value === 'object') {
    return true; // Valid JSON object
  }

  return false;
}
