/**
 * Type Guards for Runtime Validation
 * Provides type-safe validation for JSON content structures
 */

import { JSONContent } from '@tiptap/core';
import { WikiContent } from '@/provider/wiki-schema';

/**
 * Type guard for TipTap JSONContent
 */
export function isTipTapContent(obj: unknown): obj is JSONContent {
  if (!obj || typeof obj !== 'object') return false;

  const content = obj as JSONContent;
  return (
    typeof content.type === 'string' &&
    (content.content === undefined || Array.isArray(content.content))
  );
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
 * Validates TipTap content structure deeply
 */
export function validateTipTapContent(content: unknown): { valid: boolean; error?: string } {
  if (!content || typeof content !== 'object') {
    return { valid: false, error: 'Content must be an object' };
  }

  const tipTap = content as JSONContent;

  if (typeof tipTap.type !== 'string') {
    return { valid: false, error: 'Content must have a type property' };
  }

  if (tipTap.content !== undefined && !Array.isArray(tipTap.content)) {
    return { valid: false, error: 'Content property must be an array if present' };
  }

  // Recursively validate nested content
  if (Array.isArray(tipTap.content)) {
    for (let i = 0; i < tipTap.content.length; i++) {
      const result = validateTipTapContent(tipTap.content[i]);
      if (!result.valid) {
        return { valid: false, error: `Invalid content at index ${i}: ${result.error}` };
      }
    }
  }

  return { valid: true };
}

/**
 * Detects if page content was corrupted by JSON.stringify bug
 */
export function isCorruptedPageContent(content: unknown): boolean {
  if (!content || typeof content !== 'object') return false;

  const obj = content as Record<string, unknown>;

  // Check if it looks like stringified WikiContent instead of TipTap
  return (
    'version' in obj &&
    'sections' in obj &&
    'media' in obj &&
    'metadata' in obj &&
    typeof obj.version === 'number'
  );
}

/**
 * Safely parses TipTap content from unknown input
 */
export function parseTipTapContent(input: unknown): JSONContent | null {
  if (!input) return null;

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return isTipTapContent(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return isTipTapContent(input) ? input : null;
}

/**
 * Safely parses WikiContent from unknown input
 */
export function parseWikiContent(input: unknown): WikiContent | null {
  if (!input) return null;

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return isWikiContent(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return isWikiContent(input) ? input : null;
}
