/**
 * Type Guards and Runtime Validation
 *
 * Provides runtime type checking for JSON content that Prisma stores.
 * These guards help prevent errors from corrupted or malformed data.
 */

import { JSONContent } from '@tiptap/core';
import { WikiContent } from '@/provider/wiki-schema';

/**
 * Type guard for TipTap JSONContent
 */
export function isTipTapContent(obj: unknown): obj is JSONContent {
  if (!obj || typeof obj !== 'object') return false;

  const content = obj as JSONContent;
  return typeof content.type === 'string';
}

/**
 * Type guard for WikiContent
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
 * Validates TipTap content structure with detailed error messages
 */
export function validateTipTapContent(content: unknown): { valid: boolean; error?: string } {
  if (!content || typeof content !== 'object') {
    return { valid: false, error: 'Content must be an object' };
  }

  const json = content as JSONContent;

  if (typeof json.type !== 'string') {
    return { valid: false, error: 'Content must have a "type" string property' };
  }

  if (json.type === 'doc' && !Array.isArray(json.content)) {
    return { valid: false, error: 'Document node must have a "content" array' };
  }

  return { valid: true };
}

/**
 * Detects if page content is corrupted (e.g., from JSON.stringify bug)
 * Returns true if the content appears to be stringified WikiContent
 */
export function isCorruptedPageContent(content: unknown): boolean {
  if (!content || typeof content !== 'object') return false;

  const json = content as JSONContent;

  // Check if it's a doc with a single paragraph containing JSON-like text
  if (
    json.type === 'doc' &&
    Array.isArray(json.content) &&
    json.content.length === 1 &&
    json.content[0].type === 'paragraph'
  ) {
    const paragraph = json.content[0];
    if (
      Array.isArray(paragraph.content) &&
      paragraph.content.length === 1 &&
      paragraph.content[0].type === 'text'
    ) {
      const text = paragraph.content[0].text;
      if (typeof text === 'string') {
        // Check if text looks like stringified JSON
        return (
          text.includes('"media":') &&
          text.includes('"version":') &&
          text.includes('"metadata":')
        );
      }
    }
  }

  return false;
}

/**
 * Safely parses WikiContent from unknown Prisma JSON
 */
export function parseWikiContent(value: unknown): WikiContent | null {
  if (!value) return null;

  try {
    if (isWikiContent(value)) return value;

    // Try parsing if it's a string
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      if (isWikiContent(parsed)) return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Safely parses TipTap content from unknown Prisma JSON
 */
export function parseTipTapContent(value: unknown): JSONContent | null {
  if (!value) return null;

  try {
    if (isTipTapContent(value)) return value;

    // Try parsing if it's a string
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      if (isTipTapContent(parsed)) return parsed;
    }

    return null;
  } catch {
    return null;
  }
}
