'use client';

import { useState, useMemo } from 'react';
import { FiSearch, FiBookOpen } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';
import { Terminology } from '@prisma/client';

type TerminologyClientProps = {
  terminologies: Terminology[];
};

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

export default function TerminologyClient({ terminologies }: TerminologyClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(terminologies.map(t => t.category)));
    return ['All', ...cats.sort()];
  }, [terminologies]);

  const filteredTerms = useMemo(() => {
    let filtered = terminologies;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    // Filter by search with fuzzy matching
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.trim();

      // Score each term
      const scored = filtered.map(term => {
        const termScore = fuzzyMatch(term.term, query);
        const definitionScore = fuzzyMatch(term.definition, query) * 0.8;
        const categoryScore = fuzzyMatch(term.category, query) * 0.5;

        return {
          ...term,
          score: Math.max(termScore, definitionScore, categoryScore),
        };
      });

      // Filter and sort by score
      filtered = scored
        .filter(term => term.score > 0)
        .sort((a, b) => b.score - a.score);
    } else {
      // Default alphabetical sort when no search
      filtered = [...filtered].sort((a, b) => a.term.localeCompare(b.term));
    }

    return filtered;
  }, [debouncedQuery, selectedCategory, terminologies]);

  // Get category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: terminologies.length };
    terminologies.forEach(t => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [terminologies]);

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/20">
              <FiBookOpen className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Medical Terminology
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-light ml-14">
            Common medical abbreviations and terms for ED documentation
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xl pointer-events-none" />
            <input
              type="text"
              placeholder="Search terminology (e.g., 'BP', 'heart', 'respiratory')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl pl-14 pr-6 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 dark:focus:ring-purple-400/50 focus:border-transparent transition-all shadow-sm hover:shadow-md font-light text-base"
            />
          </div>
          {debouncedQuery && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 ml-1 font-light">
              Found <span className="font-medium text-gray-700 dark:text-gray-300">{filteredTerms.length}</span> result{filteredTerms.length !== 1 ? 's' : ''} for &quot;{debouncedQuery}&quot;
            </p>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                  : 'bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/70'
              }`}
            >
              {category}
              <span className="ml-2 text-xs opacity-75">
                {categoryCounts[category] || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Results Count */}
        {!debouncedQuery && (
          <div className="mb-6">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-light ml-1">
              Showing {filteredTerms.length} term{filteredTerms.length !== 1 ? 's' : ''}
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            </p>
          </div>
        )}

        {/* Terminology List */}
        {filteredTerms.length === 0 ? (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-16 text-center shadow-sm">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSearch className="text-gray-400 dark:text-gray-500 text-2xl" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-light mb-2">
                No terminology found
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Try a different search term or category
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {filteredTerms.map((term, index) => (
                <div
                  key={index}
                  className="group px-6 py-5 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Term and Category */}
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                          {term.term}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          {term.category}
                        </span>
                      </div>

                      {/* Definition */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                        {term.definition}
                      </p>

                      {/* Examples */}
                      {term.examples && term.examples.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            Examples: {term.examples.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="mt-8 bg-purple-50/50 dark:bg-purple-900/10 backdrop-blur-xl border border-purple-200/50 dark:border-purple-800/50 rounded-2xl p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
            <span className="font-medium text-gray-900 dark:text-gray-200">💡 Tip:</span> Use the category filters to narrow down your search, or type keywords to find specific terms. The search supports fuzzy matching for easier lookups.
          </p>
        </div>
      </div>
    </div>
  );
}
