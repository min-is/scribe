'use client';

import { Provider } from '@prisma/client';
import { useState, memo, useCallback } from 'react';
import { FiUsers, FiX, FiFileText } from 'react-icons/fi';
import { EditorRenderer } from '@/components/editor/EditorRenderer';
import { incrementProviderViewCount } from '@/provider/actions';

// Extended provider type with page content for modal display
type ProviderWithContent = Provider & {
  page: { content: any } | null;
};

interface ProvidersPageClientProps {
  providers: ProviderWithContent[];
}

// Helper functions for difficulty labels (pure functions, don't need memoization)
const getDifficultyLabel = (difficulty: number | null) => {
  if (!difficulty) return 'Not Rated';
  if (difficulty <= 3) return 'Beginner Friendly';
  if (difficulty <= 6) return 'Moderate';
  if (difficulty <= 8) return 'Advanced';
  return 'Very Advanced';
};

const getDifficultyColor = (difficulty: number | null) => {
  if (!difficulty) return 'from-gray-500/20 to-gray-600/20';
  if (difficulty <= 3) return 'from-green-500/20 to-emerald-600/20';
  if (difficulty <= 6) return 'from-blue-500/20 to-cyan-600/20';
  if (difficulty <= 8) return 'from-orange-500/20 to-amber-600/20';
  return 'from-red-500/20 to-rose-600/20';
};

// Memoized provider card component to prevent unnecessary re-renders
const ProviderCard = memo(function ProviderCard({
  provider,
  onClick,
}: {
  provider: ProviderWithContent;
  onClick: (provider: ProviderWithContent) => void;
}) {
  return (
    <div
      onClick={() => onClick(provider)}
      className="group relative cursor-pointer"
    >
      {/* Frosted Glass Card */}
      <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all duration-300 ease-out hover:border-gray-300/80 dark:hover:border-gray-600/80">
        {/* Gradient Background Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getDifficultyColor(provider.generalDifficulty)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

        {/* Content */}
        <div className="relative p-4">
          {/* Provider Name & Credentials */}
          <div className={provider.generalDifficulty ? 'mb-2' : ''}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
              {provider.name}
            </h3>
            {provider.credentials && (
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {provider.credentials}
              </p>
            )}
          </div>

          {/* Difficulty Rating - Compact inline layout */}
          {provider.generalDifficulty && (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div
                    key={index}
                    className={`w-1 h-1 rounded-full ${
                      index < provider.generalDifficulty!
                        ? 'bg-gray-700 dark:bg-gray-300'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {getDifficultyLabel(provider.generalDifficulty)}
              </span>
            </div>
          )}
        </div>

        {/* Hover Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
      </div>
    </div>
  );
});

export default function ProvidersPageClient({
  providers,
}: ProvidersPageClientProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithContent | null>(null);

  // Handle provider card click - show modal instead of navigating
  const handleProviderClick = useCallback(async (provider: ProviderWithContent) => {
    setSelectedProvider(provider);
    // Track view when opening
    await incrementProviderViewCount(provider.slug);
  }, []);

  const handleClose = () => {
    setSelectedProvider(null);
  };

  // Get display content for the modal
  const getDisplayContent = (provider: ProviderWithContent) => {
    if (provider.page?.content) {
      return provider.page.content;
    }
    // Fallback empty content
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [] }],
    };
  };

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

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 rounded-2xl shadow-lg shadow-purple-500/30 flex items-center justify-center">
              <FiUsers className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Providers
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-normal ml-14">
            Review ED provider-specific documentation preferences and workflow expectations. Difficulty ratings reflect a general consensus on the relative learning curve for new scribes.
          </p>
        </div>

        {/* Provider Cards Grid */}
        {providers.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500 dark:text-gray-400 text-lg font-normal">
              No providers available yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onClick={handleProviderClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="sticky top-4 float-right mr-4 mt-4 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors z-10"
              aria-label="Close"
            >
              <FiX className="text-xl text-gray-700 dark:text-gray-300" />
            </button>

            <div className="p-8 pt-6">
              {/* Header */}
              <div className="mb-6">
                {selectedProvider.icon && (
                  <div className="text-6xl mb-4">{selectedProvider.icon}</div>
                )}
                <h2 className="text-4xl font-semibold text-gray-900 dark:text-white tracking-tight">
                  {selectedProvider.name}
                  {selectedProvider.credentials && (
                    <span className="text-gray-500 dark:text-gray-400">, {selectedProvider.credentials}</span>
                  )}
                </h2>
              </div>

              <div className="space-y-4">
                {/* Note Smart Phrase - at top, compact */}
                {getSmartPhraseText(selectedProvider.noteSmartPhrase) && (
                  <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Smart Phrase
                      </span>
                    </div>
                    <code className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                      {getSmartPhraseText(selectedProvider.noteSmartPhrase)}
                    </code>
                  </div>
                )}

                {/* Content */}
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
                  <h4 className="text-gray-900 dark:text-white font-semibold text-base mb-3 flex items-center gap-2">
                    <FiFileText className="text-gray-600 dark:text-gray-400" />
                    Provider Preferences
                  </h4>
                  <div className="prose dark:prose-invert max-w-none">
                    <EditorRenderer content={getDisplayContent(selectedProvider)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
