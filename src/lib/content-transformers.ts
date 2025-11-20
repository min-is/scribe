import { JSONContent } from '@tiptap/core';
import type { WikiContent } from './dtos/provider.dto';

/**
 * Content Transformers
 *
 * Single source of truth for all content transformations.
 * Replaces scattered, inconsistent implementations throughout the codebase.
 */
export class ContentTransformers {
  /**
   * Convert WikiContent to TipTap JSON
   * Extracts visible sections and merges them into a single document
   */
  static wikiContentToTipTap(wikiContent: WikiContent): JSONContent {
    if (!wikiContent || !wikiContent.sections) {
      return {
        type: 'doc',
        content: [],
      };
    }

    // Get visible sections, sorted by order
    const visibleSections = wikiContent.sections
      .filter((section) => section.visible !== false)
      .sort((a, b) => a.order - b.order);

    // Merge all section content into a single document
    const mergedContent: any[] = [];

    for (const section of visibleSections) {
      if (section.content && section.content.content) {
        // Add section content to merged document
        mergedContent.push(...section.content.content);
      }
    }

    return {
      type: 'doc',
      content: mergedContent.length > 0 ? mergedContent : [],
    };
  }

  /**
   * Convert plain text or markdown to TipTap JSON
   */
  static textToTipTap(text: string): JSONContent {
    if (!text || text.trim() === '') {
      return {
        type: 'doc',
        content: [],
      };
    }

    // Split into paragraphs
    const paragraphs = text.split('\n\n').filter((p) => p.trim() !== '');

    const content = paragraphs.map((paragraph) => ({
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text: paragraph.trim(),
        },
      ],
    }));

    return {
      type: 'doc',
      content,
    };
  }

  /**
   * Convert TipTap JSON to plain text
   * Used for generating searchable textContent
   */
  static tipTapToPlainText(content: JSONContent): string {
    if (!content || !content.content) {
      return '';
    }

    const extractText = (node: any): string => {
      if (node.type === 'text') {
        return node.text || '';
      }

      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join('');
      }

      return '';
    };

    return content.content.map(extractText).join('\n').trim();
  }

  /**
   * Convert legacy provider fields to WikiContent format
   * For backward compatibility during migration
   */
  static legacyToWikiContent(
    noteTemplate?: string | null,
    noteSmartPhrase?: string | null
  ): WikiContent | null {
    if (!noteTemplate && !noteSmartPhrase) {
      return null;
    }

    const sections = [];

    if (noteTemplate) {
      sections.push({
        id: 'legacy-note-template',
        type: 'overview',
        order: 0,
        title: 'Note Template',
        content: this.textToTipTap(noteTemplate),
        visible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (noteSmartPhrase) {
      sections.push({
        id: 'legacy-smart-phrase',
        type: 'overview',
        order: 1,
        title: 'Smart Phrase',
        content: this.textToTipTap(noteSmartPhrase),
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
   * Validate TipTap content structure
   */
  static validateTipTapContent(content: any): boolean {
    if (!content || typeof content !== 'object') {
      return false;
    }

    if (content.type !== 'doc') {
      return false;
    }

    if (!Array.isArray(content.content)) {
      return false;
    }

    return true;
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
   * Create TipTap document with placeholder text
   */
  static createPlaceholderDocument(text: string): JSONContent {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text,
            },
          ],
        },
      ],
    };
  }
}
