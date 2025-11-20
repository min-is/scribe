/**
 * Type Guards for Runtime Type Validation
 *
 * Provides runtime type checking for JSON content types.
 */

import { JSONContent } from '@tiptap/core';
import { WikiContent, WikiSection } from '@/provider/wiki-schema';

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
 * Validates TipTap content structure
 * Returns true if valid, throws with detailed error message if invalid
 */
export function validateTipTapContent(content: unknown): content is JSONContent {
  if (!content || typeof content !== 'object') {
    throw new Error('Content must be an object');
  }

  const json = content as JSONContent;

  if (typeof json.type !== 'string') {
    throw new Error('Content must have a type property');
  }

  if (json.content !== undefined && !Array.isArray(json.content)) {
    throw new Error('Content property must be an array');
  }

  return true;
}

/**
 * Detects corrupted page content (from the JSON.stringify bug)
 */
export function isCorruptedPageContent(content: unknown): boolean {
  if (typeof content === 'string') {
    // Check if it's a stringified WikiContent object
    return (
      content.includes('"media":') ||
      content.includes('"version":') ||
      content.includes('"sections":')
    );
  }

  if (content && typeof content === 'object') {
    const obj = content as any;
    // Check if it has WikiContent structure instead of TipTap structure
    return (
      typeof obj.version === 'number' &&
      Array.isArray(obj.sections) &&
      Array.isArray(obj.media)
    );
  }

  return false;
}

/**
 * Safely parses TipTap content from unknown type
 */
export function parseTipTapContent(content: unknown): JSONContent | null {
  if (!content) return null;

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return isTipTapContent(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return isTipTapContent(content) ? content : null;
}

/**
 * Safely parses WikiContent from unknown type
 */
export function parseWikiContent(content: unknown): WikiContent | null {
  if (!content) return null;

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return isWikiContent(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return isWikiContent(content) ? content : null;
}
