/**
 * Content Transformers
 * Centralized utilities for content format conversions
 */

import { JSONContent } from '@tiptap/core';
import { WikiContent, WikiSection } from '@/provider/wiki-schema';

/**
 * Converts WikiContent to TipTap JSON format by extracting visible sections
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

  // Combine all visible sections into a single document
  const content: JSONContent[] = [];

  for (const section of visibleSections) {
    // Add section title as heading
    content.push({
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: section.title }],
    });

    // Add section content
    if (section.content && section.content.content) {
      content.push(...section.content.content);
    }
  }

  return {
    type: 'doc',
    content,
  };
}

/**
 * Converts TipTap JSON content to plain text for search indexing
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

  return extractText(content).trim().replace(/\s+/g, ' ');
}

/**
 * Converts plain text or markdown to basic TipTap format
 */
export function textToTipTap(text: string): JSONContent {
  if (!text || text.trim().length === 0) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    };
  }

  // Split by newlines and create paragraphs
  const paragraphs = text
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => ({
      type: 'paragraph' as const,
      content: [{ type: 'text' as const, text: line.trim() }],
    }));

  return {
    type: 'doc',
    content: paragraphs.length > 0 ? paragraphs : [{ type: 'paragraph', content: [] }],
  };
}

/**
 * Migrates legacy provider fields to WikiContent format
 */
export function legacyToWikiContent(
  noteTemplate?: string | null,
  noteSmartPhrase?: string | null
): WikiContent {
  const sections: WikiSection[] = [];
  let order = 0;

  if (noteTemplate) {
    sections.push({
      id: crypto.randomUUID(),
      type: 'preferences',
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
      type: 'smartphrases',
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
