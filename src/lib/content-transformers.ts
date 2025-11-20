/**
 * Content Transformers
 *
 * Centralized utilities for transforming between different content formats.
 * This module provides a single source of truth for content transformations,
 * ensuring consistency across the application.
 */

import { JSONContent } from '@tiptap/core';
import { WikiContent, WikiSection } from '@/provider/wiki-schema';

/**
 * Content transformation utilities
 */
export class ContentTransformers {
  /**
   * Convert WikiContent to TipTap JSON format
   * Extracts visible sections and merges their content into a single document
   */
  static wikiContentToTipTap(wikiContent: WikiContent): JSONContent {
    if (!wikiContent || !wikiContent.sections || wikiContent.sections.length === 0) {
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

    const content: JSONContent[] = [];

    // Extract only visible sections, sorted by order
    const visibleSections = wikiContent.sections
      .filter((section) => section.visible)
      .sort((a, b) => a.order - b.order);

    for (const section of visibleSections) {
      // Add section heading
      if (section.title) {
        content.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: section.title }],
        });
      }

      // Add section content (already in TipTap format)
      if (section.content && section.content.content) {
        // Section content is already a TipTap JSONContent object
        // We extract its nodes and add them to the main document
        content.push(...section.content.content);
      }
    }

    return {
      type: 'doc',
      content: content.length > 0 ? content : [
        { type: 'paragraph', content: [] }
      ],
    };
  }

  /**
   * Convert plain text to TipTap JSON
   * Handles markdown-style headings and lists
   */
  static textToTipTap(text: string, title?: string): JSONContent {
    const content: JSONContent[] = [];

    if (title) {
      content.push({
        type: 'heading',
        attrs: { level: 1 },
        content: [{ type: 'text', text: title }],
      });
    }

    if (!text || text.trim().length === 0) {
      content.push({
        type: 'paragraph',
        content: [],
      });
      return { type: 'doc', content };
    }

    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.length === 0) {
        // Skip empty lines
        continue;
      }

      // Check for markdown headings
      if (trimmed.startsWith('### ')) {
        content.push({
          type: 'heading',
          attrs: { level: 3 },
          content: [{ type: 'text', text: trimmed.slice(4) }],
        });
      } else if (trimmed.startsWith('## ')) {
        content.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: trimmed.slice(3) }],
        });
      } else if (trimmed.startsWith('# ')) {
        content.push({
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: trimmed.slice(2) }],
        });
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // Bullet point
        content.push({
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: trimmed.slice(2) }],
                },
              ],
            },
          ],
        });
      } else if (/^\d+\.\s/.test(trimmed)) {
        // Numbered list
        content.push({
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: trimmed.replace(/^\d+\.\s/, '') }],
                },
              ],
            },
          ],
        });
      } else {
        // Regular paragraph
        content.push({
          type: 'paragraph',
          content: [{ type: 'text', text: trimmed }],
        });
      }
    }

    return {
      type: 'doc',
      content: content.length > 0 ? content : [
        { type: 'paragraph', content: [] }
      ],
    };
  }

  /**
   * Extract plain text from TipTap JSON for search indexing
   * Recursively extracts all text nodes
   */
  static tipTapToPlainText(content: JSONContent): string {
    const extractFromNode = (node: JSONContent): string => {
      if (node.type === 'text' && node.text) {
        return node.text;
      }

      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractFromNode).filter(Boolean).join(' ');
      }

      return '';
    };

    if (!content || !content.content) {
      return '';
    }

    return content.content
      .map(extractFromNode)
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  /**
   * Merge legacy provider fields into WikiContent format
   * Used for backward compatibility during migration
   */
  static legacyToWikiContent(
    noteTemplate?: string | null,
    noteSmartPhrase?: string | null,
    preferences?: unknown
  ): JSONContent {
    const parts: string[] = [];

    if (noteTemplate) {
      parts.push(`## Note Template\n${noteTemplate}`);
    }

    if (noteSmartPhrase) {
      parts.push(`## SmartPhrases\n${noteSmartPhrase}`);
    }

    if (preferences && typeof preferences === 'object') {
      parts.push(`## Preferences\n${JSON.stringify(preferences, null, 2)}`);
    }

    const combinedText = parts.join('\n\n');
    return this.textToTipTap(combinedText);
  }

  /**
   * Create empty TipTap document
   */
  static createEmptyDocument(): JSONContent {
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

  /**
   * Extract visible sections from WikiContent
   * Returns array of sections that should be displayed
   */
  static extractVisibleSections(wikiContent: WikiContent): WikiSection[] {
    if (!wikiContent || !wikiContent.sections) {
      return [];
    }

    return wikiContent.sections
      .filter((section) => section.visible)
      .sort((a, b) => a.order - b.order);
  }
}
