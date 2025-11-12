'use client';

import { WikiContent } from '@/provider/wiki-schema';
import { EditorRenderer } from '../editor/EditorRenderer';
import { TableOfContents } from './TableOfContents';

interface WikiContentRendererProps {
  wikiContent: WikiContent;
  showTOC?: boolean;
}

export function WikiContentRenderer({
  wikiContent,
  showTOC = true,
}: WikiContentRendererProps) {
  const visibleSections = wikiContent.sections.filter((s) => s.visible);

  if (visibleSections.length === 0) {
    return (
      <div className="text-center py-8 text-dim">
        <p>No content available for this provider</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-3 space-y-8">
        {visibleSections.map((section) => (
          <section
            key={section.id}
            id={`section-${section.id}`}
            className="scroll-mt-4"
          >
            {/* Section Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
              <h2 className="text-2xl font-bold text-main">{section.title}</h2>
              <div className="text-xs text-dim mt-1">
                Last updated: {new Date(section.updatedAt).toLocaleDateString()}
              </div>
            </div>

            {/* Section Content */}
            <div className="prose dark:prose-invert max-w-none">
              <EditorRenderer content={section.content} />
            </div>
          </section>
        ))}
      </div>

      {/* Table of Contents (Desktop) */}
      {showTOC && visibleSections.length > 1 && (
        <aside className="hidden lg:block lg:col-span-1">
          <TableOfContents sections={wikiContent.sections} />
        </aside>
      )}
    </div>
  );
}
