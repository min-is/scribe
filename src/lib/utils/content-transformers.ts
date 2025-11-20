/**
 * Content Transformers
 *
 * Centralized utilities for transforming content between different formats
 * Single source of truth for all content conversions
 */

import { JSONContent } from '@tiptap/core';
import { WikiContent, WikiSection } from '@/provider/wiki-schema';

/**
 * Convert WikiContent to TipTap JSONContent
 * Extracts visible sections and combines them into a single TipTap document
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

  // Combine all section content
  const combinedContent: JSONContent[] = [];

  for (const section of visibleSections) {
    // Add section title as heading
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
 * Convert plain text to TipTap JSONContent
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
    type: 'paragraph',
    content: line.trim() ? [{ type: 'text', text: line }] : [],
  }));

  return {
    type: 'doc',
    content: paragraphs,
  };
}

/**
 * Convert TipTap JSONContent to plain text for search indexing
 */
export function tipTapToPlainText(content: JSONContent): string {
  if (!content || !content.content) return '';

  const extractText = (node: JSONContent): string => {
    let text = '';

    if (node.type === 'text' && node.text) {
      text += node.text;
    }

    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        text += extractText(child);
      }
    }

    // Add space after block elements
    if (['paragraph', 'heading', 'listItem'].includes(node.type || '')) {
      text += ' ';
    }

    return text;
  };

  return extractText(content).trim();
}

/**
 * Migrate legacy content fields to WikiContent
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

/**
 * Extract the first section's content from WikiContent
 * Useful for previews and summaries
 */
export function extractFirstSection(wikiContent: WikiContent): JSONContent | null {
  const firstVisible = wikiContent.sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order)[0];

  return firstVisible?.content || null;
}
