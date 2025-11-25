'use client';

import { useState, useMemo } from 'react';
import { FiSearch, FiPackage } from 'react-icons/fi';
import { useDebounce } from 'use-debounce';
import { Medication } from '@prisma/client';

type MedicationEntry = {
  name: string;
  brandNames?: string | null;
  type: string;
  commonlyUsedFor?: string | null;
  tags?: string[];
};

interface MedicationsClientProps {
  allMedications: Medication[];
}

// Enhanced fuzzy matching with phonetic support
// This function allows phonetic/misspelled searches (e.g., "Methadoan" finds "Methadone", "Elikwis" finds "Eliquis")
function fuzzyMatch(str: string, pattern: string): number {
  const strLower = str.toLowerCase();
  const patternLower = pattern.toLowerCase();

  // Exact match gets highest score
  if (strLower === patternLower) return 100;

  // Starts with pattern gets very high score
  if (strLower.startsWith(patternLower)) return 90;

  // Contains pattern gets high score
  if (strLower.includes(patternLower)) return 80;

  // Phonetic character mapping for common substitutions
  const phoneticMap: Record<string, string[]> = {
    'f': ['ph'],
    'k': ['c', 'q'],
    's': ['c', 'z'],
    'i': ['y', 'e'],
    'u': ['oo'],
    'z': ['s'],
  };

  // Helper: Check if two characters are phonetically similar
  function arePhoneticallySimilar(c1: string, c2: string): boolean {
    if (c1 === c2) return true;
    return phoneticMap[c1]?.includes(c2) || phoneticMap[c2]?.includes(c1) || false;
  }

  // Fuzzy character-by-character matching with phonetic support
  let score = 0;
  let patternIdx = 0;
  let consecutiveMatches = 0;
  let phoneticMatches = 0;

  for (let i = 0; i < strLower.length && patternIdx < patternLower.length; i++) {
    const strChar = strLower[i];
    const patternChar = patternLower[patternIdx];

    if (strChar === patternChar) {
      // Exact character match
      score += 3;
      consecutiveMatches++;
      // Bonus for consecutive matches (helps with phonetic spelling)
      if (consecutiveMatches > 1) {
        score += consecutiveMatches * 1.5;
      }
      patternIdx++;
    } else if (arePhoneticallySimilar(strChar, patternChar)) {
      // Phonetic match (slightly lower score than exact)
      score += 2.5;
      consecutiveMatches++;
      phoneticMatches++;
      if (consecutiveMatches > 1) {
        score += consecutiveMatches;
      }
      patternIdx++;
    } else {
      consecutiveMatches = 0;
    }
  }

  // All characters found (exact or phonetic) - be more lenient with scoring
  if (patternIdx === patternLower.length) {
    // Calculate match percentage
    const matchPercentage = score / (strLower.length * 2);

    // Higher ceiling for fuzzy matches (75 instead of 60)
    // This allows phonetic matches to rank higher
    const fuzzyScore = Math.min(matchPercentage * 100, 75);

    // Bonus if most matches were exact (not just phonetic)
    const exactMatchRatio = (patternLower.length - phoneticMatches) / patternLower.length;
    return fuzzyScore + (exactMatchRatio * 5);
  }

  return 0;
}

export default function MedicationsClient({
  allMedications,
}: MedicationsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [displayLimit, setDisplayLimit] = useState(100);

  // Filter and rank medications using fuzzy matching
  const filteredMedications = useMemo(() => {
    if (!debouncedQuery.trim()) {
      // Show all medications when no search
      return allMedications;
    }

    const query = debouncedQuery.trim();

    // Score each medication
    const scored = allMedications.map(med => {
      const nameScore = fuzzyMatch(med.name, query);

      // For brand names, check both the full string and individual brand names
      let brandNamesScore = 0;
      if (med.brandNames) {
        // Try matching against full brand names string
        brandNamesScore = fuzzyMatch(med.brandNames, query);

        // Also try each individual brand name (split by comma)
        const individualBrands = med.brandNames.split(',').map(b => b.trim());
        for (const brand of individualBrands) {
          const individualScore = fuzzyMatch(brand, query);
          brandNamesScore = Math.max(brandNamesScore, individualScore);
        }

        // Brand names are almost as important as medication name
        brandNamesScore *= 0.98;
      }

      const typeScore = fuzzyMatch(med.type, query) * 0.5;
      const usageScore = med.commonlyUsedFor ? fuzzyMatch(med.commonlyUsedFor, query) * 0.7 : 0;

      return {
        ...med,
        score: Math.max(nameScore, brandNamesScore, typeScore, usageScore),
      };
    });

    // Filter by score threshold (0 = no match) and sort by score
    return scored
      .filter(med => med.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [debouncedQuery, allMedications]);

  // Convert database medications to display format
  const medicationsList: MedicationEntry[] = useMemo(() => {
    return filteredMedications.map(med => ({
      name: med.name,
      brandNames: med.brandNames,
      type: med.type,
      commonlyUsedFor: med.commonlyUsedFor,
      tags: med.tags,
    }));
  }, [filteredMedications]);

  // Limit displayed medications for performance (only when not searching)
  const displayedMedications = useMemo(() => {
    if (debouncedQuery.trim()) {
      // Show all search results
      return medicationsList;
    }
    // Limit display when showing all medications
    return medicationsList.slice(0, displayLimit);
  }, [medicationsList, displayLimit, debouncedQuery]);

  const hasMore = !debouncedQuery.trim() && medicationsList.length > displayLimit;

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
            Quick reference for all {allMedications.length.toLocaleString()} medications - search by name, brand, type
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xl pointer-events-none" />
            <input
              type="text"
              placeholder="Search medications (e.g., 'Methadone', 'Eliquis', 'beta blocker', 'pain')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl pl-14 pr-6 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 focus:border-transparent transition-all shadow-sm hover:shadow-md font-light text-base"
            />
          </div>
          {debouncedQuery && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 ml-1 font-light">
              Found <span className="font-medium text-gray-700 dark:text-gray-300">{medicationsList.length}</span> result{medicationsList.length !== 1 ? 's' : ''} for &quot;{debouncedQuery}&quot;
            </p>
          )}
        </div>

        {/* Results Count */}
        {!debouncedQuery && (
          <div className="mb-6">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-light ml-1">
              Showing {displayedMedications.length.toLocaleString()} of {medicationsList.length.toLocaleString()} medication{medicationsList.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Medications List */}
        {displayedMedications.length === 0 ? (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-16 text-center shadow-sm">
            <div className="max-w-sm mx-auto">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiSearch className="text-gray-400 dark:text-gray-500 text-2xl" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg font-light mb-2">
                {allMedications.length === 0 ? 'No medications in database' : 'No medications found'}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                {allMedications.length === 0
                  ? 'Import medications via the admin panel to get started'
                  : 'Try a different search term or check your spelling'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {displayedMedications.map((med, index) => (
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

                      {/* Brand Names */}
                      {med.brandNames && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                          Brand name{med.brandNames.includes(',') ? 's' : ''}: {med.brandNames}
                        </p>
                      )}

                      {/* Type Badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
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
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setDisplayLimit(prev => prev + 100)}
              className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-sm"
            >
              Load More ({(medicationsList.length - displayLimit).toLocaleString()} remaining)
            </button>
          </div>
        )}

        {/* Info Note */}
        <div className="mt-8 bg-blue-50/50 dark:bg-blue-900/10 backdrop-blur-xl border border-blue-200/50 dark:border-blue-800/50 rounded-2xl p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
            <span className="font-medium text-gray-900 dark:text-gray-200">💡 Tip:</span> Search supports phonetic matching - you can spell medications how they sound if you're unsure about the spelling!
          </p>
        </div>
      </div>
    </div>
  );
}
