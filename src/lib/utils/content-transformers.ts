/**
 * Content Transformers
 *
 * Centralized utilities for transforming content between different formats:
 * - WikiContent ↔ TipTap JSON
 * - Plain text ↔ TipTap JSON
 * - Legacy fields → WikiContent
 *
 * This ensures a single source of truth for all content transformations.
 */

import { JSONContent } from '@tiptap/core';
import { WikiContent, WikiSection } from '@/provider/wiki-schema';

/**
 * Converts WikiContent to TipTap JSON format by extracting visible sections.
 * This is the primary transformation used when migrating provider data to pages.
 *
 * @param wikiContent - The WikiContent object to transform
 * @returns TipTap JSON content combining all visible sections
 */
export function wikiContentToTipTap(wikiContent: WikiContent): JSONContent {
  if (!wikiContent || !wikiContent.sections) {
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

  // Filter visible sections and sort by order
  const visibleSections = wikiContent.sections
    .filter((section: WikiSection) => section.visible)
    .sort((a: WikiSection, b: WikiSection) => a.order - b.order);

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
    // Add section title as heading
    if (section.title) {
      combinedContent.push({
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: section.title }],
      });
    }

    // Add section content
    if (section.content && section.content.content) {
      combinedContent.push(...section.content.content);
    }
  }

  return {
    type: 'doc',
    content: combinedContent.length > 0 ? combinedContent : [{ type: 'paragraph', content: [] }],
  };
}

/**
 * Converts TipTap JSON content to plain text for search indexing.
 * Recursively extracts all text nodes from the JSON structure.
 *
 * @param content - TipTap JSON content
 * @returns Plain text string
 */
export function tipTapToPlainText(content: JSONContent): string {
  if (!content) return '';

  let text = '';

  if (content.type === 'text' && content.text) {
    text += content.text;
  }

  if (content.content && Array.isArray(content.content)) {
    for (const child of content.content) {
      text += tipTapToPlainText(child) + ' ';
    }
  }

  return text.trim();
}

/**
 * Converts plain text or markdown to TipTap JSON format.
 * Handles basic formatting by splitting into paragraphs.
 *
 * @param text - Plain text or markdown string
 * @returns TipTap JSON content
 */
export function textToTipTap(text: string): JSONContent {
  if (!text || text.trim() === '') {
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    };
  }

  // Split by double newlines to create paragraphs
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim() !== '');

  if (paragraphs.length === 0) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: text }] }],
    };
  }

  return {
    type: 'doc',
    content: paragraphs.map((para) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: para.trim() }],
    })),
  };
}

/**
 * Migrates legacy provider fields to WikiContent format.
 * Used when a provider doesn't have wikiContent but has legacy fields.
 *
 * @param noteTemplate - Legacy note template
 * @param noteSmartPhrase - Legacy smart phrase
 * @param preferences - Legacy preferences JSON
 * @returns WikiContent object
 */
export function legacyToWikiContent(
  noteTemplate?: string | null,
  noteSmartPhrase?: string | null,
  preferences?: unknown,
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
