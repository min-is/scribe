/**
 * Type Guards
 *
 * Runtime type validation utilities.
 * Replaces unsafe 'as any' casts with proper type checking.
 */

import type { JSONContent } from '@tiptap/core';
import type { WikiContent } from '@/provider/wiki-schema';

/**
 * Type guard for TipTap JSONContent.
 */
export function isTipTapContent(obj: unknown): obj is JSONContent {
  if (typeof obj !== 'object' || obj === null) return false;

  const content = obj as JSONContent;
  return typeof content.type === 'string';
}

/**
 * Type guard for WikiContent.
 */
export function isWikiContent(obj: unknown): obj is WikiContent {
  if (typeof obj !== 'object' || obj === null) return false;

  const wiki = obj as WikiContent;
  return (
    typeof wiki.version === 'number' &&
    Array.isArray(wiki.sections) &&
    Array.isArray(wiki.media) &&
    typeof wiki.metadata === 'object' &&
    wiki.metadata !== null
  );
}

/**
 * Validates TipTap content structure.
 * Returns detailed error messages for invalid content.
 */
export function validateTipTapContent(content: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!content || typeof content !== 'object') {
    return { valid: false, error: 'Content must be an object' };
  }

  const tipTap = content as JSONContent;

  if (tipTap.type !== 'doc') {
    return { valid: false, error: 'Root node must be of type "doc"' };
  }

  if (!Array.isArray(tipTap.content)) {
    return { valid: false, error: 'Content must have a "content" array' };
  }

  return { valid: true };
}

/**
 * Detects if page content was corrupted by JSON.stringify bug.
 */
export function isCorruptedPageContent(content: unknown): boolean {
  if (typeof content !== 'object' || content === null) return false;

  const obj = content as Record<string, unknown>;

  // Check for stringified WikiContent structure
  return (
    'media' in obj &&
    'version' in obj &&
    'sections' in obj &&
    'metadata' in obj &&
    typeof obj.version === 'number'
  );
}

/**
 * Safely parses potential TipTap content.
 */
export function parseTipTapContent(value: unknown): JSONContent | null {
  if (!value) return null;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return isTipTapContent(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return isTipTapContent(value) ? value : null;
}

/**
 * Safely parses potential WikiContent.
 */
export function parseWikiContent(value: unknown): WikiContent | null {
  if (!value) return null;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return isWikiContent(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return isWikiContent(value) ? value : null;
}
