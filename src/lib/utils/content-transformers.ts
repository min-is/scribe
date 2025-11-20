/**
 * Content Transformers
 *
 * Centralized utilities for converting between different content formats.
 * Single source of truth for all content transformations.
 */

import type { JSONContent } from '@tiptap/core';
import type { WikiContent } from '@/provider/wiki-schema';

/**
 * Converts WikiContent to TipTap JSONContent format.
 * Extracts visible sections and combines them into a single TipTap document.
 */
export function wikiContentToTipTap(wikiContent: WikiContent): JSONContent {
  const visibleSections = wikiContent.sections.filter((section) => section.visible);

  if (visibleSections.length === 0) {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [],
        },
      ],
    };
  }

  // Combine all visible sections into a single TipTap document
  const content: JSONContent[] = [];

  for (const section of visibleSections) {
    if (section.content && typeof section.content === 'object') {
      // If the section has TipTap content, extract its content nodes
      if (section.content.type === 'doc' && Array.isArray(section.content.content)) {
        content.push(...section.content.content);
      } else {
        // Otherwise, add the section content as-is
        content.push(section.content as JSONContent);
      }
    }
  }

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph', content: [] }],
  };
}

/**
 * Converts plain text to TipTap JSONContent format.
 */
export function textToTipTap(text: string): JSONContent {
  if (!text || text.trim().length === 0) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    };
  }

  // Split by paragraphs and convert to TipTap nodes
  const paragraphs = text.split('\n\n').filter((p) => p.trim().length > 0);

  return {
    type: 'doc',
    content: paragraphs.map((p) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: p.trim() }],
    })),
  };
}

/**
 * Converts TipTap JSONContent to plain text.
 * Useful for generating searchable text content.
 */
export function tipTapToPlainText(content: JSONContent): string {
  if (!content || !content.content) {
    return '';
  }

  const extractText = (node: JSONContent): string => {
    if (node.type === 'text' && node.text) {
      return node.text;
    }

    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join('');
    }

    return '';
  };

  return content.content.map(extractText).join('\n');
}

/**
 * Converts legacy provider fields to WikiContent format.
 * Helps migrate from old noteTemplate/noteSmartPhrase to WikiContent.
 */
export function legacyToWikiContent(
  noteTemplate?: string | null,
  noteSmartPhrase?: string | null
): WikiContent | null {
  const content: string[] = [];

  if (noteTemplate) content.push(noteTemplate);
  if (noteSmartPhrase) content.push(noteSmartPhrase);

  if (content.length === 0) return null;

  const combinedText = content.join('\n\n');
  const tipTapContent = textToTipTap(combinedText);

  return {
    version: 1,
    sections: [
      {
        id: 'legacy-migration',
        type: 'overview',
        title: 'Overview',
        order: 0,
        visible: true,
        content: tipTapContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    media: [],
    metadata: {
      lastEditedAt: new Date().toISOString(),
      totalEdits: 0,
    },
  };
}
