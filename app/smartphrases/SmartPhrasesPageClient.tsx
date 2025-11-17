'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { SmartPhrase, incrementSmartPhraseUsage } from '@/smartphrase/actions';
import {
  FiSearch,
  FiCopy,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
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

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
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

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-main mb-2">
            SmartPhrase Library
          </h1>
          <p className="text-dim text-lg">
            Browse and search EPIC SmartPhrases (.phrases) for clinical
            documentation
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col gap-6 mb-8">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-dim text-xl" />
                <input
                  type="text"
                  placeholder="Search by phrase, title, category, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-medium border border-main rounded-lg pl-12 pr-4 py-3 text-main placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              {debouncedQuery && (
                <p className="text-dim text-sm mt-2">
                  Found {filteredPhrases.length} result
                  {filteredPhrases.length !== 1 ? 's' : ''} for &quot;
                  {debouncedQuery}&quot;
                </p>
              )}
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-medium text-sm">
                Showing {filteredPhrases.length} of {smartphrases.length}{' '}
                SmartPhrases
              </p>
            </div>

            {/* SmartPhrase Table */}
            {filteredPhrases.length === 0 ? (
              <div className="bg-medium border border-main rounded-lg p-12 text-center">
                <p className="text-dim text-lg mb-2">No SmartPhrases found</p>
                <p className="text-dim text-sm">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <div className="bg-medium border border-main rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-dim border-b border-main">
                      <tr>
                        <th className="text-left px-4 py-3 text-main font-semibold text-sm w-12">
                          {/* Expand icon column */}
                        </th>
                        <th className="text-left px-4 py-3 text-main font-semibold text-sm">
                          Dot Phrase
                        </th>
                        <th className="text-left px-4 py-3 text-main font-semibold text-sm hidden md:table-cell">
                          Category
                        </th>
                        <th className="text-left px-4 py-3 text-main font-semibold text-sm hidden lg:table-cell">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPhrases.map((phrase, index) => {
                        const isExpanded = expandedRows.has(phrase.id);
                        const isCopied = copiedId === phrase.id;

                        return (
                          <>
                            <tr
                              key={phrase.id}
                              className={`border-b border-main/50 hover:bg-dim/30 transition-colors ${
                                index % 2 === 0 ? 'bg-medium' : 'bg-dim/10'
                              }`}
                            >
                              {/* Expand button */}
                              <td className="px-4 py-3 w-12">
                                <button
                                  onClick={() => toggleRow(phrase.id)}
                                  className="text-dim/50 hover:text-main transition-colors bg-transparent"
                                  aria-label={
                                    isExpanded ? 'Collapse' : 'Expand'
                                  }
                                >
                                  {isExpanded ? (
                                    <FiChevronDown className="text-lg" />
                                  ) : (
                                    <FiChevronRight className="text-lg" />
                                  )}
                                </button>
                              </td>

                              {/* Dot Phrase */}
                              <td className="px-4 py-3">
                                <p className="text-main font-medium text-sm">
                                  {phrase.slug}
                                </p>
                              </td>

                              {/* Category - hidden on mobile */}
                              <td className="px-4 py-3 hidden md:table-cell">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  {phrase.category}
                                </span>
                              </td>

                              {/* Description - hidden on smaller screens */}
                              <td className="px-4 py-3 hidden lg:table-cell">
                                <p className="text-dim text-sm truncate">
                                  {phrase.description || '—'}
                                </p>
                              </td>
                            </tr>

                            {/* Expanded content row */}
                            {isExpanded && (
                              <tr key={`${phrase.id}-expanded`}>
                                <td colSpan={4} className="p-0">
                                  <div className="bg-content border-t border-main/50 p-6 animate-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-4">
                                      {/* Mobile-only category and description */}
                                      <div className="md:hidden space-y-2">
                                        <div>
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            {phrase.category}
                                          </span>
                                        </div>
                                        {phrase.description && (
                                          <p className="text-dim text-sm">
                                            {phrase.description}
                                          </p>
                                        )}
                                      </div>

                                      {/* Copy button */}
                                      <div className="flex justify-end">
                                        <button
                                          onClick={() => handleCopy(phrase)}
                                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                            isCopied
                                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20'
                                          }`}
                                          disabled={isCopied}
                                        >
                                          {isCopied ? (
                                            <>
                                              <FiCheck className="text-sm" />
                                              Copied
                                            </>
                                          ) : (
                                            <>
                                              <FiCopy className="text-sm" />
                                              Copy
                                            </>
                                          )}
                                        </button>
                                      </div>

                                      {/* Full content */}
                                      <div>
                                        <h4 className="text-main font-semibold text-sm mb-2">
                                          Full Content:
                                        </h4>
                                        <div className="bg-medium border border-main rounded-lg p-4">
                                          <pre className="text-medium text-sm whitespace-pre-wrap font-mono leading-relaxed">
                                            {phrase.content}
                                          </pre>
                                        </div>
                                      </div>

                                      {/* Tags */}
                                      {phrase.tags.length > 0 && (
                                        <div>
                                          <h4 className="text-main font-semibold text-sm mb-2">
                                            Tags:
                                          </h4>
                                          <div className="flex flex-wrap gap-2">
                                            {phrase.tags.map((tag: string) => (
                                              <span
                                                key={tag}
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20"
                                              >
                                                {tag}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Usage count */}
                                      <div className="text-dim text-xs">
                                        Used {phrase.usageCount} time
                                        {phrase.usageCount !== 1 ? 's' : ''}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
