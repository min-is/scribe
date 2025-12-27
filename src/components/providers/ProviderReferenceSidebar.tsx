'use client';

import { useState } from 'react';
import { useAppState, ReferenceProvider } from '@/state/AppState';
import { FiX, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { EditorRenderer } from '@/components/editor/EditorRenderer';

// Extract text from noteSmartPhrase (handles both plain text and TipTap JSON)
const getSmartPhraseText = (noteSmartPhrase: string | null): string | null => {
  if (!noteSmartPhrase) return null;

  // Try to parse as JSON (TipTap format)
  try {
    const parsed = JSON.parse(noteSmartPhrase);
    if (parsed?.type === 'doc' && parsed?.content) {
      // Extract text from TipTap JSON
      const extractText = (nodes: any[]): string => {
        return nodes.map(node => {
          if (node.type === 'text') return node.text || '';
          if (node.content) return extractText(node.content);
          return '';
        }).join('');
      };
      return extractText(parsed.content);
    }
  } catch {
    // Not JSON, return as plain text
  }
  return noteSmartPhrase;
};

// Get display content for the provider
const getDisplayContent = (provider: ReferenceProvider) => {
  if (provider.page?.content) {
    return provider.page.content;
  }
  // Fallback empty content
  return {
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }],
  };
};

export default function ProviderReferenceSidebar() {
  const { referenceProvider, setReferenceProvider } = useAppState();
  const [isMinimized, setIsMinimized] = useState(false);

  const handleClose = () => {
    setReferenceProvider?.(null);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleExpand = () => {
    setIsMinimized(false);
  };

  if (!referenceProvider) {
    return null;
  }

  const smartPhraseText = getSmartPhraseText(referenceProvider.noteSmartPhrase);

  // Minimized state - show subtle expand tab
  if (isMinimized) {
    return (
      <button
        onClick={handleExpand}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 p-2 pr-1 rounded-l-lg bg-white/60 dark:bg-gray-800/40 backdrop-blur-xl border border-r-0 border-white/30 dark:border-white/10 shadow-lg hover:bg-white/80 dark:hover:bg-gray-800/60 transition-all group"
        aria-label="Expand provider sidebar"
      >
        <FiChevronLeft className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
      </button>
    );
  }

  return (
    <>
      {/* Subtle backdrop - click to close (mobile only) */}
      <div
        className="fixed inset-0 z-30 lg:hidden"
        onClick={handleClose}
      />

      {/* Floating Glass Panel */}
      <div className="fixed right-4 top-16 z-40 w-96 max-h-[70vh] flex flex-col">
        {/* Glass container */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl bg-white/60 dark:bg-gray-800/40 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-black/40">
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                {referenceProvider.name}
              </h2>
              {referenceProvider.credentials && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {referenceProvider.credentials}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Minimize button */}
              <button
                onClick={handleMinimize}
                className="p-1 opacity-40 hover:opacity-100 transition-opacity"
                aria-label="Minimize sidebar"
              >
                <FiChevronRight className="text-base text-gray-600 dark:text-gray-300" />
              </button>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="p-1 opacity-40 hover:opacity-100 transition-opacity"
                aria-label="Close sidebar"
              >
                <FiX className="text-base text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Smart Phrase - compact inline */}
            {smartPhraseText && (
              <div className="px-3 py-2 rounded-lg bg-gray-100/50 dark:bg-gray-800/50">
                <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Smart Phrase
                </span>
                <code className="block mt-0.5 text-sm text-gray-700 dark:text-gray-300 font-mono">
                  {smartPhraseText}
                </code>
              </div>
            )}

            {/* Provider Preferences */}
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-p:leading-relaxed">
              <EditorRenderer content={getDisplayContent(referenceProvider)} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
