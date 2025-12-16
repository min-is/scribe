'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { SmartPhrase, incrementSmartPhraseUsage } from '@/smartphrase/actions';
import {
  FiSearch,
  FiCopy,
  FiCheck,
  FiX,
  FiMessageSquare,
} from 'react-icons/fi';
import { useDebounce } from 'use-debounce';

interface SmartPhrasesPageClientProps {
  smartphrases: SmartPhrase[];
  categories: string[];
}

export default function SmartPhrasesPageClient({
  smartphrases,
  categories,
}: SmartPhrasesPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPhrase, setSelectedPhrase] = useState<SmartPhrase | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter smartphrases based on search and category
  const filteredPhrases = useMemo(() => {
    let filtered = smartphrases;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.slug.toLowerCase().includes(query) ||
          p.title.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          p.tags.some((tag: string) => tag.toLowerCase().includes(query)),
      );
    }

    return filtered;
  }, [smartphrases, selectedCategory, debouncedQuery]);

  const handlePhraseClick = (phrase: SmartPhrase) => {
    setSelectedPhrase(phrase);
  };

  const handleClose = () => {
    setSelectedPhrase(null);
  };

  const handleCopy = async (phrase: SmartPhrase) => {
    try {
      await navigator.clipboard.writeText(phrase.content);
      setCopiedId(phrase.id);
      toast.success('SmartPhrase copied to clipboard!', {
        description: phrase.slug,
        duration: 2000,
      });

      // Track usage
      await incrementSmartPhraseUsage(phrase.id);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
      console.error('Copy failed:', error);
    }
  };

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: smartphrases.length };
    smartphrases.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [smartphrases]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'All': 'from-gray-500/20 to-gray-600/20',
      'General': 'from-blue-500/20 to-cyan-600/20',
      'Cardiology': 'from-red-500/20 to-rose-600/20',
      'Neurology': 'from-purple-500/20 to-violet-600/20',
      'Orthopedics': 'from-orange-500/20 to-amber-600/20',
      'Pediatrics': 'from-green-500/20 to-emerald-600/20',
    };
    return colors[category] || 'from-blue-500/20 to-cyan-600/20';
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/20 flex items-center justify-center">
              <FiMessageSquare className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
              SmartPhrase Library
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-normal ml-14">
            Browse and search SmartPhrases (.phrases) for more efficient documentation
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search by phrase, title, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl pl-14 pr-6 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-all shadow-sm"
            />
          </div>
          {debouncedQuery && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 text-center font-normal">
              Found {filteredPhrases.length} result{filteredPhrases.length !== 1 ? 's' : ''} for &quot;{debouncedQuery}&quot;
            </p>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {['All', ...categories].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                  : 'bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {category}
              <span className="ml-2 text-xs opacity-70">
                {categoryCounts[category] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Results Count */}
        <div className="mb-6 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-normal">
            Showing {filteredPhrases.length} of {smartphrases.length} SmartPhrases
          </p>
        </div>

        {/* SmartPhrase List */}
        {filteredPhrases.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500 dark:text-gray-400 text-lg font-normal mb-2">
              No SmartPhrases found
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {filteredPhrases.map((phrase) => {
                const isCopied = copiedId === phrase.id;

                return (
                  <div
                    key={phrase.id}
                    className="group px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors cursor-pointer"
                    onClick={() => handlePhraseClick(phrase)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Phrase info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
                            {phrase.slug}
                          </h3>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {phrase.category}
                          </span>
                        </div>
                        {phrase.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                            {phrase.description}
                          </p>
                        )}
                        {/* Tags Preview */}
                        {phrase.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {phrase.tags.slice(0, 5).map((tag: string) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-500/10 text-gray-600 dark:text-gray-400"
                              >
                                {tag}
                              </span>
                            ))}
                            {phrase.tags.length > 5 && (
                              <span className="inline-flex items-center px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                                +{phrase.tags.length - 5} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedPhrase && (
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
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    {selectedPhrase.category}
                  </span>
                  <button
                    onClick={() => handleCopy(selectedPhrase)}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      copiedId === selectedPhrase.id
                        ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                    }`}
                  >
                    {copiedId === selectedPhrase.id ? (
                      <>
                        <FiCheck />
                        Copied
                      </>
                    ) : (
                      <>
                        <FiCopy />
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                </div>
                <h2 className="text-4xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight font-mono">
                  {selectedPhrase.slug}
                </h2>
                {selectedPhrase.description && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-normal">
                    {selectedPhrase.description}
                  </p>
                )}
              </div>

              <div className="space-y-6">
                {/* Full Content */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                  <h4 className="text-gray-900 dark:text-white font-semibold text-base mb-3">
                    Full Content
                  </h4>
                  <pre className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                    {selectedPhrase.content}
                  </pre>
                </div>

                {/* Tags */}
                {selectedPhrase.tags.length > 0 && (
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-semibold text-base mb-3">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPhrase.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-500/10 text-gray-700 dark:text-gray-300 border border-gray-500/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
