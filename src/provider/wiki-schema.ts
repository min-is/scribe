/**
 * Wiki Content Schema for Provider Profiles
 *
 * This defines the structure for rich, wiki-like provider documentation
 * stored in the Provider.preferences JSON field.
 */

import { JSONContent } from '@tiptap/core';

/**
 * Section types for organizing provider information
 */
export type SectionType =
  | 'overview'        // General information about the provider
  | 'preferences'     // Clinical preferences and workflow
  | 'scenarios'       // How to handle specific scenarios (code blue, etc.)
  | 'tips'           // Tips and tricks for working with this provider
  | 'smartphrases'   // EPIC smartphrases and documentation
  | 'procedures'     // Procedure-specific documentation
  | 'custom';        // Custom sections

/**
 * Media types supported
 */
export type MediaType = 'image' | 'video' | 'audio' | 'document';

/**
 * Individual media item
 */
export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  filename: string;
  size: number;           // File size in bytes
  mimeType: string;
  caption?: string;
  altText?: string;
  uploadedAt: string;     // ISO 8601 timestamp
  uploadedBy?: string;    // User ID or name
}

/**
 * Content section with rich text
 */
export interface WikiSection {
  id: string;
  type: SectionType;
  title: string;
  order: number;          // For sorting sections
  content: JSONContent;   // Tiptap JSON content
  visible: boolean;       // Show/hide section
  createdAt: string;
  updatedAt: string;
}

/**
 * Table of contents entry (auto-generated from sections and headings)
 */
export interface TOCEntry {
  id: string;
  title: string;
  level: number;          // Heading level (1-6)
  sectionId: string;      // Which section this belongs to
}

/**
 * Complete wiki content structure
 */
export interface WikiContent {
  version: number;        // Schema version for migrations
  content?: JSONContent;  // Single rich text content (v2 - simplified structure)
  sections: WikiSection[]; // Legacy: array of sections (v1 - kept for backward compatibility)
  media: MediaItem[];
  metadata: {
    lastEditedBy?: string;
    lastEditedAt: string;
    totalEdits: number;
    featuredImage?: string; // URL to featured/profile image
  };
}

/**
 * Default empty wiki content
 */
export const createEmptyWikiContent = (): WikiContent => ({
  version: 2,
  content: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }],
  },
  sections: [], // Legacy field kept for backward compatibility
  media: [],
  metadata: {
    lastEditedAt: new Date().toISOString(),
    totalEdits: 0,
  },
});

/**
 * Create a new section with defaults
 */
export const createSection = (
  type: SectionType,
  title: string,
  order: number,
): WikiSection => ({
  id: crypto.randomUUID(),
  type,
  title,
  order,
  content: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [],
      },
    ],
  },
  visible: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/**
 * Section templates for quick creation
 */
export const SECTION_TEMPLATES: Record<SectionType, { title: string; placeholder: string }> = {
  overview: {
    title: 'Overview',
    placeholder: 'Provide a general overview of this provider\'s style, background, and key information...',
  },
  preferences: {
    title: 'Clinical Preferences',
    placeholder: 'Document the provider\'s workflow preferences, charting style, and clinical approach...',
  },
  scenarios: {
    title: 'Common Scenarios',
    placeholder: 'Describe how to handle specific scenarios with this provider (codes, traumas, procedures)...',
  },
  tips: {
    title: 'Tips & Tricks',
    placeholder: 'Share helpful tips, shortcuts, and best practices for working with this provider...',
  },
  smartphrases: {
    title: 'SmartPhrases',
    placeholder: 'Document EPIC smartphrases, dot phrases, and templates used by this provider...',
  },
  procedures: {
    title: 'Procedures',
    placeholder: 'Detailed documentation for specific procedures and how to document them...',
  },
  custom: {
    title: 'Custom Section',
    placeholder: 'Add custom content here...',
  },
};

/**
 * Validate wiki content structure
 */
export const validateWikiContent = (content: unknown): content is WikiContent => {
  if (!content || typeof content !== 'object') return false;

  const wiki = content as WikiContent;

  // Basic structure validation
  const hasBasicStructure =
    typeof wiki.version === 'number' &&
    Array.isArray(wiki.media) &&
    typeof wiki.metadata === 'object' &&
    typeof wiki.metadata.lastEditedAt === 'string' &&
    typeof wiki.metadata.totalEdits === 'number';

  if (!hasBasicStructure) return false;

  // For v2+, we need either content or sections
  // For backward compatibility, sections array can be empty if content exists
  const hasContent = wiki.content && typeof wiki.content === 'object';
  const hasSections = Array.isArray(wiki.sections);

  return hasContent || hasSections;
};

/**
 * Check if wiki content uses the new simplified structure (v2)
 */
export const isSimplifiedWikiContent = (content: WikiContent): boolean => {
  return content.version >= 2 && content.content !== undefined;
};

/**
 * Get the content to display from WikiContent (handles both v1 sections and v2 content)
 */
export const getWikiDisplayContent = (wikiContent: WikiContent): JSONContent => {
  // If we have direct content (v2), use it
  if (wikiContent.content && wikiContent.content.type === 'doc') {
    return wikiContent.content;
  }

  // Otherwise, merge sections into single content (v1 backward compatibility)
  const visibleSections = wikiContent.sections.filter((s) => s.visible);

  if (visibleSections.length === 0) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    };
  }

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
      mergedContent.push(...(section.content.content as JSONContent[]));
    }
  }

  return {
    type: 'doc',
    content: mergedContent.length > 0 ? mergedContent : [{ type: 'paragraph', content: [] }],
  };
};

/**
 * Migrate legacy provider data to wiki format
 */
export const migrateLegacyContent = (
  noteTemplate?: string | null,
  noteSmartPhrase?: string | null,
  preferences?: unknown,
): WikiContent => {
  const wikiContent = createEmptyWikiContent();

  // Migrate noteTemplate to Preferences section
  if (noteTemplate) {
    const prefsSection = createSection('preferences', 'Clinical Preferences', 0);
    prefsSection.content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: noteTemplate,
            },
          ],
        },
      ],
    };
    wikiContent.sections.push(prefsSection);
  }

  // Migrate noteSmartPhrase to SmartPhrases section
  if (noteSmartPhrase) {
    const smartphrasesSection = createSection('smartphrases', 'SmartPhrases', 1);
    smartphrasesSection.content = {
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          attrs: { language: 'text' },
          content: [
            {
              type: 'text',
              text: noteSmartPhrase,
            },
          ],
        },
      ],
    };
    wikiContent.sections.push(smartphrasesSection);
  }

  return wikiContent;
};
