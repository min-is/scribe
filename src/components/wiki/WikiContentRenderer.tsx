'use client';

import { WikiContent, getWikiDisplayContent } from '@/provider/wiki-schema';
import { EditorRenderer } from '../editor/EditorRenderer';

interface WikiContentRendererProps {
  wikiContent: WikiContent;
  showTOC?: boolean; // Kept for backward compatibility but no longer used
}

export function WikiContentRenderer({
  wikiContent,
}: WikiContentRendererProps) {
  // Get the display content - handles both v1 (sections) and v2 (single content)
  const displayContent = getWikiDisplayContent(wikiContent);

  // Check if there's any actual content
  const hasContent = displayContent.content &&
    displayContent.content.length > 0 &&
    !(displayContent.content.length === 1 &&
      displayContent.content[0].type === 'paragraph' &&
      (!displayContent.content[0].content || displayContent.content[0].content.length === 0));

  if (!hasContent) {
    return (
      <div className="text-center py-8 text-dim">
        <p>No content available for this provider</p>
      </div>
    );
  }

  return (
    <div className="prose dark:prose-invert max-w-none">
      <EditorRenderer content={displayContent} />
    </div>
  );
}
