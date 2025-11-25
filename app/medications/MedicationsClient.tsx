'use client';

import { useState, useMemo } from 'react';
import { FiSearch, FiPackage } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';
import { Medication } from '@prisma/client';
import { loadMoreMedications } from '@/medication/actions';

type MedicationEntry = {
  name: string;
  type: string;
  commonlyUsedFor?: string;
  tags?: string[];
};

interface MedicationsClientProps {
  initialMedications: Medication[];
  totalCount: number;
  initialLimit: number;
}

// Enhanced fuzzy matching with Levenshtein-like scoring
function fuzzyMatch(str: string, pattern: string): number {
  const strLower = str.toLowerCase();
  const patternLower = pattern.toLowerCase();

  // Exact match gets highest score
  if (strLower === patternLower) return 100;

  // Starts with pattern gets very high score
  if (strLower.startsWith(patternLower)) return 90;

  // Contains pattern gets high score
  if (strLower.includes(patternLower)) return 80;

  // Fuzzy character-by-character matching
  let score = 0;
  let patternIdx = 0;
  let consecutiveMatches = 0;

  for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
    if (strLower[i] === patternLower[patternIdx]) {
      score += 2;
      consecutiveMatches++;
      // Bonus for consecutive matches
      if (consecutiveMatches > 1) {
        score += consecutiveMatches;
      }
      patternIdx++;
    } else {
      consecutiveMatches = 0;
    }
  }

  // All characters found
  if (patternIdx === patternLower.length) {
    return Math.min((score / strLower.length) * 60, 60);
  }

  return 0;
}

export default function MedicationsClient({
  initialMedications,
  totalCount,
  initialLimit,
}: MedicationsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [medications, setMedications] = useState<Medication[]>(initialMedications);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialMedications.length >= initialLimit);

  // Convert database medications to display format
  const medicationsList: MedicationEntry[] = useMemo(() => {
    return medications.map(med => ({
      name: med.name,
      type: med.type,
      commonlyUsedFor: med.commonlyUsedFor || undefined,
      tags: med.tags,
    }));
  }, [medications]);

  const filteredMedications = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return medicationsList;
    }

    const query = debouncedQuery.trim();

    // Score each medication
    const scored = medicationsList.map(med => {
      const nameScore = fuzzyMatch(med.name, query);
      const typeScore = fuzzyMatch(med.type, query) * 0.7;
      const tagsScore = med.tags
        ? Math.max(...med.tags.map(tag => fuzzyMatch(tag, query)), 0) * 0.8
        : 0;

      return {
        ...med,
        score: Math.max(nameScore, typeScore, tagsScore),
      };
    });

    // Filter and sort by score
    return scored
      .filter(med => med.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [debouncedQuery, medicationsList]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const result = await loadMoreMedications(
        medications.length,
        initialLimit,
        debouncedQuery || undefined
      );

      setMedications(prev => [...prev, ...result.medications]);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Failed to load more medications:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const showingCount = filteredMedications.length;
  const displayTotalCount = debouncedQuery ? showingCount : totalCount;

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg shadow-blue-500/20">
              <FiPackage className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Medications
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-light ml-14">
            Quick reference for medications - fuzzy search enabled for misspellings
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xl pointer-events-none" />
            <input
              type="text"
              placeholder="Search medications (e.g., 'lisnpril', 'beta blocker', 'pain')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl pl-14 pr-6 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-transparent transition-all shadow-sm hover:shadow-md font-light text-base"
            />
          </div>
          {debouncedQuery && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 ml-1 font-light">
              Found <span className="font-medium text-gray-700 dark:text-gray-300">{filteredMedications.length}</span> result{filteredMedications.length !== 1 ? 's' : ''} for &quot;{debouncedQuery}&quot;
            </p>
          )}
        </div>

        {/* Results Count */}
        {!debouncedQuery && (
          <div className="mb-6">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-light ml-1">
              Showing {showingCount} of {displayTotalCount} medication{displayTotalCount !== 1 ? 's' : ''}
              {hasMore && !debouncedQuery && ' (scroll down to load more)'}
            </p>
          </div>
        )}

        {/* Medications List */}
        {filteredMedications.length === 0 ? (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-16 text-center shadow-sm">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSearch className="text-gray-400 dark:text-gray-500 text-2xl" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-light mb-2">
                {totalCount === 0 ? 'No medications in database' : 'No medications found'}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                {totalCount === 0
                  ? 'Import medications via the admin panel to get started'
                  : 'Try a different search term or check your spelling'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {filteredMedications.map((med, index) => (
                  <div
                    key={index}
                    className="group px-6 py-5 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Medication Name */}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1.5 tracking-tight">
                          {med.name}
                        </h3>

                        {/* Type Badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            {med.type}
                          </span>
                        </div>

                        {/* Description */}
                        {med.commonlyUsedFor && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                            {med.commonlyUsedFor}
                          </p>
                        )}

                        {/* Tags */}
                        {med.tags && med.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {med.tags.map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-500/10 text-gray-600 dark:text-gray-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Load More Button */}
            {hasMore && !debouncedQuery && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? 'Loading...' : `Load More (${totalCount - showingCount} remaining)`}
                </button>
              </div>
            )}
          </>
        )}

        {/* Info Note */}
        <div className="mt-8 bg-blue-50/50 dark:bg-blue-900/10 backdrop-blur-xl border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
            <span className="font-medium text-gray-900 dark:text-gray-200">💡 Tip:</span> The search supports fuzzy matching, so you can find medications even with slight misspellings. Try searching for &quot;lisnpril&quot; to find Lisinopril.
          </p>
        </div>
      </div>
    </div>
  );
}
