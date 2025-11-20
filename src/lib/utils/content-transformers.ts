/**
 * Content Transformers
 *
 * Centralized utilities for transforming content between different formats.
 * Single source of truth for WikiContent ↔ TipTap conversions.
 */

import { JSONContent } from '@tiptap/core';
import { WikiContent } from '@/provider/wiki-schema';

/**
 * Converts WikiContent to TipTap JSON format
 * Extracts visible sections and combines their content
 */
export function wikiContentToTipTap(wikiContent: WikiContent): JSONContent {
  const visibleSections = wikiContent.sections
    .filter((section) => section.visible)
    .sort((a, b) => a.order - b.order);

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

  // Combine all section content into a single document
  const combinedContent: JSONContent[] = [];

  for (const section of visibleSections) {
    // Add section title as a heading
    combinedContent.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: section.title }],
    });

    // Add section content
    if (section.content && section.content.content) {
      combinedContent.push(...section.content.content);
    }
  }

  return {
    type: 'doc',
    content: combinedContent,
  };
}

/**
 * Converts TipTap JSON content to plain text for search
 */
export function tipTapToPlainText(content: JSONContent): string {
  if (!content || !content.content) {
    return '';
  }

  const extractText = (node: JSONContent): string => {
    if (node.type === 'text') {
      return node.text || '';
    }

    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join(' ');
    }

    return '';
  };

  return extractText(content).trim();
}

/**
 * Converts plain text or markdown to TipTap JSON format
 */
export function textToTipTap(text: string): JSONContent {
  if (!text || text.trim() === '') {
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    };
  }

  // Split by newlines and create paragraphs
  const paragraphs = text.split('\n').map((line) => ({
    type: 'paragraph' as const,
    content: line.trim()
      ? [{ type: 'text' as const, text: line }]
      : [],
  }));

  return {
    type: 'doc',
    content: paragraphs,
  };
}

/**
 * Migrates legacy content fields to WikiContent format
 */
export function legacyToWikiContent(
  noteTemplate?: string | null,
  noteSmartPhrase?: string | null
): WikiContent | null {
  if (!noteTemplate && !noteSmartPhrase) {
    return null;
  }

  const sections = [];
  let order = 0;

  if (noteTemplate) {
    sections.push({
      id: crypto.randomUUID(),
      type: 'preferences' as const,
      title: 'Clinical Preferences',
      order: order++,
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
      order: order++,
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
