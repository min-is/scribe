import type { JSONContent } from '@tiptap/core';
import type { WikiContent, WikiSection } from './content-transformers';

/**
 * Type guard for TipTap JSONContent
 */
export function isTipTapContent(obj: unknown): obj is JSONContent {
  if (!obj || typeof obj !== 'object') return false;

  const content = obj as Record<string, unknown>;
  return typeof content.type === 'string';
}

/**
 * Type guard for WikiContent
 */
export function isWikiContent(obj: unknown): obj is WikiContent {
  if (!obj || typeof obj !== 'object') return false;

  const wiki = obj as Record<string, unknown>;
  return (
    Array.isArray(wiki.media) &&
    typeof wiki.version === 'number' &&
    typeof wiki.metadata === 'object' &&
    Array.isArray(wiki.sections)
  );
}

/**
 * Type guard for WikiSection
 */
export function isWikiSection(obj: unknown): obj is WikiSection {
  if (!obj || typeof obj !== 'object') return false;

  const section = obj as Record<string, unknown>;
  return (
    typeof section.id === 'string' &&
    typeof section.type === 'string' &&
    typeof section.order === 'number' &&
    typeof section.title === 'string' &&
    typeof section.visible === 'boolean' &&
    isTipTapContent(section.content)
  );
}

/**
 * Validates TipTap content structure
 */
export function validateTipTapContent(content: unknown): { valid: boolean; error?: string } {
  if (!content || typeof content !== 'object') {
    return { valid: false, error: 'Content must be an object' };
  }

  const obj = content as Record<string, unknown>;

  if (!obj.type || typeof obj.type !== 'string') {
    return { valid: false, error: 'Content must have a type property' };
  }

  if (obj.type === 'doc' && (!obj.content || !Array.isArray(obj.content))) {
    return { valid: false, error: 'Doc type must have a content array' };
  }

  return { valid: true };
}

/**
 * Detects if content has been incorrectly stringified (the bug we're fixing)
 */
export function isCorruptedPageContent(content: unknown): boolean {
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      return isWikiContent(parsed);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Safe parser for TipTap content
 */
export function parseTipTapContent(value: unknown): JSONContent | null {
  if (!value) return null;

  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (isTipTapContent(value)) {
    return value;
  }

  return null;
}

/**
 * Safe parser for WikiContent
 */
export function parseWikiContent(value: unknown): WikiContent | null {
  if (!value) return null;

  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (isWikiContent(value)) {
    return value;
  }

  return null;
}
