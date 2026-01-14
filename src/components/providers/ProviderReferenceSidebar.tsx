'use client';

import { useState, useRef } from 'react';
import { useAppState, ReferenceProvider } from '@/state/AppState';
import { FiChevronLeft } from 'react-icons/fi';
import { EditorRenderer } from '@/components/editor/EditorRenderer';
import Draggable from 'react-draggable';

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
  const nodeRef = useRef<HTMLDivElement>(null);

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

      {/* Draggable Floating Glass Panel */}
      <Draggable
        nodeRef={nodeRef}
        handle=".drag-handle"
        bounds="parent"
        defaultPosition={{ x: 0, y: 0 }}
      >
        <div
          ref={nodeRef}
          className="fixed right-4 top-16 z-40 w-96 max-h-[80vh] flex flex-col"
        >
          {/* Glass container */}
          <div className="flex-1 flex flex-col overflow-hidden rounded-2xl bg-white/60 dark:bg-gray-800/40 backdrop-blur-2xl border border-white/30 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-black/40">
            {/* Header - Drag Handle */}
            <div className="drag-handle flex items-center justify-between p-4 cursor-grab active:cursor-grabbing">
              {/* Apple-style window controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleClose}
                  className="group w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E] hover:brightness-90 transition-all flex items-center justify-center"
                  aria-label="Close sidebar"
                >
                  <svg className="w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 6 6" fill="none">
                    <path d="M1 1L5 5M5 1L1 5" stroke="#4D0000" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </button>
                <button
                  onClick={handleMinimize}
                  className="group w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#DEA123] hover:brightness-90 transition-all flex items-center justify-center"
                  aria-label="Minimize sidebar"
                >
                  <svg className="w-1.5 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 6 6" fill="none">
                    <path d="M1 3H5" stroke="#995700" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Provider name */}
              <div className="flex-1 min-w-0 px-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate text-center">
                  {referenceProvider.name}
                </h2>
                {referenceProvider.credentials && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    {referenceProvider.credentials}
                  </p>
                )}
              </div>

              {/* Spacer for symmetry */}
              <div className="w-[52px] flex-shrink-0" />
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
      </Draggable>
    </>
  );
}
