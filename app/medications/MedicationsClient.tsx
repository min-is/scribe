'use client';

import { useState, useMemo, useEffect } from 'react';
import { FiSearch, FiPackage } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';
import { Medication } from '@prisma/client';
import { loadMoreMedications, getMedications, getMedicationsCount } from '@/medication/actions';

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

export default function MedicationsClient({
  initialMedications,
  totalCount: initialTotalCount,
  initialLimit,
}: MedicationsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [medications, setMedications] = useState<Medication[]>(initialMedications);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasMore, setHasMore] = useState(initialMedications.length >= initialLimit);

  // Server-side search effect
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.trim()) {
        setIsSearching(true);
        try {
          const searchResults = await getMedications({
            search: debouncedQuery.trim(),
            limit: initialLimit,
          });
          const searchCount = await getMedicationsCount(debouncedQuery.trim());

          setMedications(searchResults);
          setTotalCount(searchCount);
          setHasMore(searchResults.length < searchCount);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        // Reset to initial state when search is cleared
        setMedications(initialMedications);
        setTotalCount(initialTotalCount);
        setHasMore(initialMedications.length >= initialLimit);
      }
    };

    performSearch();
  }, [debouncedQuery, initialLimit, initialMedications, initialTotalCount]);

  // Convert database medications to display format
  const medicationsList: MedicationEntry[] = useMemo(() => {
    return medications.map(med => ({
      name: med.name,
      type: med.type,
      commonlyUsedFor: med.commonlyUsedFor || undefined,
      tags: med.tags,
    }));
  }, [medications]);

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

  const showingCount = medicationsList.length;

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
            Quick reference for all {initialTotalCount.toLocaleString()} medications - search by name, type, or usage
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xl pointer-events-none" />
            <input
              type="text"
              placeholder="Search medications (e.g., 'Methadone', 'beta blocker', 'pain')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl pl-14 pr-6 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-transparent transition-all shadow-sm hover:shadow-md font-light text-base"
            />
          </div>
          {isSearching && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 ml-1 font-light">
              Searching...
            </p>
          )}
          {debouncedQuery && !isSearching && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 ml-1 font-light">
              Found <span className="font-medium text-gray-700 dark:text-gray-300">{totalCount}</span> result{totalCount !== 1 ? 's' : ''} for &quot;{debouncedQuery}&quot;
            </p>
          )}
        </div>

        {/* Results Count */}
        {!debouncedQuery && (
          <div className="mb-6">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-light ml-1">
              Showing {showingCount} of {totalCount} medication{totalCount !== 1 ? 's' : ''}
              {hasMore && !debouncedQuery && ' (scroll down to load more)'}
            </p>
          </div>
        )}

        {/* Medications List */}
        {medicationsList.length === 0 && !isSearching ? (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-16 text-center shadow-sm">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSearch className="text-gray-400 dark:text-gray-500 text-2xl" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-light mb-2">
                {initialTotalCount === 0 ? 'No medications in database' : 'No medications found'}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                {initialTotalCount === 0
                  ? 'Import medications via the admin panel to get started'
                  : 'Try a different search term or check your spelling'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {medicationsList.map((med, index) => (
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
            <span className="font-medium text-gray-900 dark:text-gray-200">💡 Tip:</span> Search works across all {initialTotalCount.toLocaleString()} medications in the database. Results appear as you type with automatic debouncing.
          </p>
        </div>
      </div>
    </div>
  );
}
