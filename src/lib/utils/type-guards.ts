/**
 * Type Guards
 *
 * Runtime type validation utilities
 */

import { JSONContent } from '@tiptap/core';
import { WikiContent } from '@/provider/wiki-schema';

/**
 * Type guard for TipTap JSONContent
 */
export function isTipTapContent(value: unknown): value is JSONContent {
  if (!value || typeof value !== 'object') return false;

  const content = value as JSONContent;
  return (
    typeof content.type === 'string' &&
    (content.content === undefined || Array.isArray(content.content))
  );
}

/**
 * Type guard for WikiContent
 */
export function isWikiContent(value: unknown): value is WikiContent {
  if (!value || typeof value !== 'object') return false;

  const wiki = value as WikiContent;
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
 * Validate TipTap content structure with detailed error messages
 */
export function validateTipTapContent(value: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!value || typeof value !== 'object') {
    return { valid: false, error: 'Content must be an object' };
  }

  const content = value as JSONContent;

  if (typeof content.type !== 'string') {
    return { valid: false, error: 'Content must have a type property' };
  }

  if (content.content !== undefined && !Array.isArray(content.content)) {
    return { valid: false, error: 'Content.content must be an array' };
  }

  return { valid: true };
}

/**
 * Check if page content is corrupted (stringified JSON bug)
 */
export function isCorruptedPageContent(value: unknown): boolean {
  if (typeof value !== 'object' || !value) return false;

  const content = value as JSONContent;

  // Check for the specific corruption pattern: {"media":[],"version":1,...}
  if (
    'media' in content &&
    'version' in content &&
    'metadata' in content &&
    'sections' in content
  ) {
    return true;
  }

  return false;
}

/**
 * Safely parse WikiContent from unknown value
 */
export function parseWikiContent(value: unknown): WikiContent | null {
  if (!isWikiContent(value)) {
    return null;
  }
  return value;
}

/**
 * Safely parse TipTap content from unknown value
 */
export function parseTipTapContent(value: unknown): JSONContent | null {
  if (!isTipTapContent(value)) {
    return null;
  }
  return value;
}
