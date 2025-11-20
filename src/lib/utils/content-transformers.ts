/**
 * Content Transformation Utilities
 *
 * Centralized utilities for transforming content between different formats:
 * - WikiContent (provider wiki sections) → TipTap JSON
 * - Plain text/markdown → TipTap JSON
 * - TipTap JSON → Plain text (for search)
 */

import { JSONContent } from '@tiptap/core';
import { WikiContent } from '@/provider/wiki-schema';

/**
 * Converts WikiContent to TipTap JSON format
 * Extracts all visible sections and merges their content
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

  // Merge all section content into a single doc
  const mergedContent: JSONContent[] = [];

  for (const section of visibleSections) {
    // Add section title as heading
    mergedContent.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: section.title }],
    });

    // Add section content
    if (section.content?.content) {
      mergedContent.push(...section.content.content);
    }
  }

  return {
    type: 'doc',
    content: mergedContent.length > 0 ? mergedContent : [{ type: 'paragraph', content: [] }],
  };
}

/**
 * Converts plain text or markdown to TipTap JSON
 */
export function textToTipTap(text: string): JSONContent {
  if (!text || text.trim().length === 0) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    };
  }

  const paragraphs = text.split('\n\n').filter((p) => p.trim().length > 0);

  return {
    type: 'doc',
    content: paragraphs.map((paragraph) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: paragraph.trim() }],
    })),
  };
}

/**
 * Extracts plain text from TipTap JSON for search indexing
 */
export function tipTapToPlainText(content: JSONContent): string {
  if (!content || !content.content) return '';

  const extractText = (node: JSONContent): string => {
    if (node.type === 'text') {
      return node.text || '';
    }

    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join('');
    }

    return '';
  };

  return extractText(content).trim();
}

/**
 * Migrates legacy content fields to WikiContent format
 * Used when provider has noteTemplate/noteSmartPhrase but no wikiContent
 */
export function legacyToWikiContent(
  noteTemplate?: string | null,
  noteSmartPhrase?: string | null,
): WikiContent | null {
  if (!noteTemplate && !noteSmartPhrase) return null;

  const sections = [];

  if (noteTemplate) {
    sections.push({
      id: crypto.randomUUID(),
      type: 'preferences' as const,
      title: 'Clinical Preferences',
      order: 0,
      content: textToTipTap(noteTemplate),
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  if (noteSmartPhrase) {
    sections.push({
      id: crypto.randomUUID(),
      type: 'smartphrases' as const,
      title: 'SmartPhrases',
      order: 1,
      content: {
        type: 'doc',
        content: [
          {
            type: 'codeBlock',
            attrs: { language: 'text' },
            content: [{ type: 'text', text: noteSmartPhrase }],
          },
        ],
      },
      visible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    version: 1,
    sections,
    media: [],
    metadata: {
      lastEditedAt: new Date().toISOString(),
      totalEdits: 0,
    },
  };
}
