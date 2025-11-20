import type { JSONContent } from '@tiptap/core';

/**
 * WikiContent types based on the codebase structure
 */
export interface WikiSection {
  id: string;
  type: string;
  order: number;
  title: string;
  content: JSONContent;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WikiContent {
  media: unknown[];
  version: number;
  metadata: {
    totalEdits: number;
    lastEditedAt: string;
  };
  sections: WikiSection[];
}

/**
 * Transforms WikiContent to TipTap JSON format
 * Extracts only visible sections and combines them into a single document
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
 * Converts plain text or markdown to TipTap JSON format
 */
export function textToTipTap(text: string): JSONContent {
  const paragraphs = text.split('\n\n').filter((p) => p.trim());

  if (paragraphs.length === 0) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    };
  }

  return {
    type: 'doc',
    content: paragraphs.map((paragraph) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: paragraph }],
    })),
  };
}

/**
 * Extracts plain text from TipTap JSON for search indexing
 */
export function tipTapToPlainText(content: JSONContent): string {
  if (!content || !content.content) return '';

  let text = '';

  function extractText(node: JSONContent): void {
    if (node.type === 'text' && node.text) {
      text += node.text + ' ';
    }

    if (node.content && Array.isArray(node.content)) {
      for (const child of node.content) {
        extractText(child);
      }
    }
  }

  extractText(content);
  return text.trim();
}

/**
 * Converts legacy Provider fields to WikiContent structure
 */
export function legacyToWikiContent(
  noteTemplate?: string | null,
  noteSmartPhrase?: string | null
): WikiContent | null {
  const legacyText = noteTemplate || noteSmartPhrase;
  if (!legacyText) return null;

  return {
    media: [],
    version: 1,
    metadata: {
      totalEdits: 0,
      lastEditedAt: new Date().toISOString(),
    },
    sections: [
      {
        id: 'legacy-section',
        type: 'overview',
        order: 0,
        title: 'Overview',
        content: textToTipTap(legacyText),
        visible: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };
}
