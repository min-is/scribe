/**
 * Type Guards
 *
 * Runtime type validation utilities. These functions provide type-safe
 * validation at runtime, replacing unsafe `as any` casts with proper
 * type checking.
 */

import { JSONContent } from '@tiptap/core';
import { WikiContent, WikiSection, MediaItem } from '@/provider/wiki-schema';

/**
 * Type guard for TipTap JSONContent
 * Validates that an unknown value conforms to the TipTap content structure
 */
export function isTipTapContent(value: unknown): value is JSONContent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const content = value as JSONContent;

  // Must have a type field
  if (typeof content.type !== 'string') {
    return false;
  }

  // If it has content, it must be an array
  if (content.content !== undefined && !Array.isArray(content.content)) {
    return false;
  }

  // If it has text, it must be a string (for text nodes)
  if (content.text !== undefined && typeof content.text !== 'string') {
    return false;
  }

  // If it has attrs, it must be an object
  if (content.attrs !== undefined && (typeof content.attrs !== 'object' || content.attrs === null)) {
    return false;
  }

  // For doc nodes, content is required
  if (content.type === 'doc' && !Array.isArray(content.content)) {
    return false;
  }

  return true;
}

/**
 * Type guard for WikiContent
 * Validates that an unknown value conforms to the WikiContent schema
 */
export function isWikiContent(value: unknown): value is WikiContent {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const wiki = value as WikiContent;

  // Version must be a number
  if (typeof wiki.version !== 'number') {
    return false;
  }

  // Sections must be an array
  if (!Array.isArray(wiki.sections)) {
    return false;
  }

  // Media must be an array
  if (!Array.isArray(wiki.media)) {
    return false;
  }

  // Metadata must be an object
  if (!wiki.metadata || typeof wiki.metadata !== 'object') {
    return false;
  }

  // Metadata must have required fields
  if (
    typeof wiki.metadata.lastEditedAt !== 'string' ||
    typeof wiki.metadata.totalEdits !== 'number'
  ) {
    return false;
  }

  // Validate each section
  for (const section of wiki.sections) {
    if (!isWikiSection(section)) {
      return false;
    }
  }

  // Validate each media item
  for (const media of wiki.media) {
    if (!isMediaItem(media)) {
      return false;
    }
  }

  return true;
}

/**
 * Type guard for WikiSection
 * Validates that an unknown value conforms to the WikiSection schema
 */
export function isWikiSection(value: unknown): value is WikiSection {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const section = value as WikiSection;

  return (
    typeof section.id === 'string' &&
    typeof section.type === 'string' &&
    typeof section.title === 'string' &&
    typeof section.order === 'number' &&
    typeof section.visible === 'boolean' &&
    typeof section.createdAt === 'string' &&
    typeof section.updatedAt === 'string' &&
    isTipTapContent(section.content)
  );
}

/**
 * Type guard for MediaItem
 * Validates that an unknown value conforms to the MediaItem schema
 */
export function isMediaItem(value: unknown): value is MediaItem {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const media = value as MediaItem;

  return (
    typeof media.id === 'string' &&
    typeof media.type === 'string' &&
    typeof media.url === 'string' &&
    typeof media.filename === 'string' &&
    typeof media.size === 'number' &&
    typeof media.mimeType === 'string' &&
    typeof media.uploadedAt === 'string' &&
    (media.caption === undefined || typeof media.caption === 'string') &&
    (media.altText === undefined || typeof media.altText === 'string') &&
    (media.uploadedBy === undefined || typeof media.uploadedBy === 'string')
  );
}

/**
 * Validate TipTap content structure deeply
 * More thorough validation than isTipTapContent
 */
export function validateTipTapContent(content: unknown): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!content || typeof content !== 'object') {
    errors.push('Content must be an object');
    return { valid: false, errors };
  }

  const doc = content as JSONContent;

  if (doc.type !== 'doc') {
    errors.push('Root node must be of type "doc"');
  }

  if (!Array.isArray(doc.content)) {
    errors.push('Root node must have a content array');
  } else {
    // Recursively validate child nodes
    validateNodes(doc.content, errors, 'root');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Recursively validate content nodes
 */
function validateNodes(nodes: unknown[], errors: string[], path: string): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const nodePath = `${path}[${i}]`;

    if (!node || typeof node !== 'object') {
      errors.push(`Node at ${nodePath} must be an object`);
      continue;
    }

    const typedNode = node as JSONContent;

    if (typeof typedNode.type !== 'string') {
      errors.push(`Node at ${nodePath} must have a string type`);
    }

    // Text nodes should have text content
    if (typedNode.type === 'text') {
      if (typeof typedNode.text !== 'string') {
        errors.push(`Text node at ${nodePath} must have string text property`);
      }
    }

    // Recursively validate children
    if (Array.isArray(typedNode.content)) {
      validateNodes(typedNode.content, errors, `${nodePath}.content`);
    }
  }
}

/**
 * Safely parse JSON content from Prisma
 * Returns null if parsing fails or validation fails
 */
export function parseTipTapContent(value: unknown): JSONContent | null {
  try {
    // If it's already an object, validate it
    if (typeof value === 'object' && value !== null) {
      return isTipTapContent(value) ? (value as JSONContent) : null;
    }

    // If it's a string, try to parse it
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      return isTipTapContent(parsed) ? parsed : null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Safely parse WikiContent from Prisma Json field
 * Returns null if parsing fails or validation fails
 */
export function parseWikiContent(value: unknown): WikiContent | null {
  try {
    // If it's already an object, validate it
    if (typeof value === 'object' && value !== null) {
      return isWikiContent(value) ? (value as WikiContent) : null;
    }

    // If it's a string, try to parse it
    if (typeof value === 'string') {
      const parsed = JSON.parse(value);
      return isWikiContent(parsed) ? parsed : null;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if Page content is corrupted (contains stringified WikiContent)
 * This detects the bug where JSON.stringify was used incorrectly
 */
export function isCorruptedPageContent(content: unknown): boolean {
  if (!content || typeof content !== 'object') {
    return false;
  }

  const doc = content as JSONContent;

  // Check if it's a doc with paragraph containing stringified JSON
  if (
    doc.type === 'doc' &&
    Array.isArray(doc.content) &&
    doc.content.length > 0
  ) {
    const firstNode = doc.content[0];
    if (
      firstNode &&
      firstNode.type === 'paragraph' &&
      Array.isArray(firstNode.content) &&
      firstNode.content.length > 0
    ) {
      const textNode = firstNode.content[0];
      if (textNode && textNode.type === 'text' && typeof textNode.text === 'string') {
        // Check if the text looks like stringified WikiContent
        return (
          textNode.text.includes('"media":') ||
          textNode.text.includes('"version":') ||
          textNode.text.includes('"sections":') ||
          textNode.text.includes('"metadata":{')
        );
      }
    }
  }

  return false;
}
