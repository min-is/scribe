'use client';

import { useAppState, ReferenceProvider } from '@/state/AppState';
import { FiX, FiFileText } from 'react-icons/fi';
import { EditorRenderer } from '@/components/editor/EditorRenderer';
import { clsx } from 'clsx/lite';

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

  const handleClose = () => {
    setReferenceProvider?.(null);
  };

  if (!referenceProvider) {
    return null;
  }

  const smartPhraseText = getSmartPhraseText(referenceProvider.noteSmartPhrase);

  return (
    <>
      {/* Backdrop - click to close */}
      <div
        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
        onClick={handleClose}
      />

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed right-0 top-0 h-full z-40',
          'w-80 lg:w-96',
          'bg-white dark:bg-gray-900',
          'border-l border-gray-200 dark:border-gray-700',
          'shadow-xl',
          'transform transition-transform duration-300 ease-out',
          'flex flex-col',
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0 pr-2">
            {referenceProvider.icon && (
              <div className="text-3xl mb-2">{referenceProvider.icon}</div>
            )}
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {referenceProvider.name}
            </h2>
            {referenceProvider.credentials && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {referenceProvider.credentials}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
            aria-label="Close reference sidebar"
          >
            <FiX className="text-lg text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Smart Phrase - compact */}
          {smartPhraseText && (
            <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Smart Phrase
              </span>
              <code className="block mt-1 text-sm text-gray-800 dark:text-gray-200 font-mono">
                {smartPhraseText}
              </code>
            </div>
          )}

          {/* Provider Preferences */}
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h4 className="text-gray-900 dark:text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <FiFileText className="text-gray-500 dark:text-gray-400" />
              Provider Preferences
            </h4>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <EditorRenderer content={getDisplayContent(referenceProvider)} />
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            This sidebar persists while you navigate
          </p>
        </div>
      </div>
    </>
  );
}
