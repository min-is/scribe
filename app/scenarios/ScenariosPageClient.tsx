'use client';

import { useState, useMemo } from 'react';
import { Scenario } from '@prisma/client';
import { incrementScenarioViewCount } from '@/scenario/actions';
import {
  FiSearch,
  FiChevronDown,
  FiChevronRight,
  FiEye,
} from 'react-icons/fi';
import { useDebounce } from 'use-debounce';

interface ScenariosPageClientProps {
  scenarios: Scenario[];
  categories: string[];
}

export default function ScenariosPageClient({
  scenarios,
  categories,
}: ScenariosPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter scenarios based on search and category
  const filteredScenarios = useMemo(() => {
    let filtered = scenarios;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    // Filter by search query
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.slug.toLowerCase().includes(query) ||
          s.title.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.content.toLowerCase().includes(query) ||
          s.tags.some((tag: string) => tag.toLowerCase().includes(query)),
      );
    }

    return filtered;
  }, [scenarios, selectedCategory, debouncedQuery]);

  const toggleRow = async (id: string) => {
    const newExpanded = new Set(expandedRows);
    const wasExpanded = newExpanded.has(id);

    if (wasExpanded) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      // Track view when expanding
      await incrementScenarioViewCount(id);
    }
    setExpandedRows(newExpanded);
  };

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: scenarios.length };
    scenarios.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [scenarios]);

  return (
    <div className="min-h-screen p-8 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-main mb-2">
            Clinical Scenarios
          </h1>
          <p className="text-dim text-lg">
            Browse scenario walkthroughs for emergency and routine medical situations
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Category Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-medium border border-main rounded-lg p-4">
              <h2 className="text-lg font-semibold text-main mb-4">
                Categories
              </h2>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                    selectedCategory === 'All'
                      ? 'bg-content text-main font-semibold'
                      : 'text-medium hover:bg-dim hover:text-main'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>All Categories</span>
                    <span className="text-xs text-dim">
                      {categoryCounts['All']}
                    </span>
                  </div>
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors text-sm ${
                      selectedCategory === category
                        ? 'bg-content text-main font-semibold'
                        : 'text-medium hover:bg-dim hover:text-main'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{category}</span>
                      <span className="text-xs text-dim">
                        {categoryCounts[category] || 0}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-dim text-xl" />
                <input
                  type="text"
                  placeholder="Search by title, category, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-medium border border-main rounded-lg pl-12 pr-4 py-3 text-main placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              {debouncedQuery && (
                <p className="text-dim text-sm mt-2">
                  Found {filteredScenarios.length} result
                  {filteredScenarios.length !== 1 ? 's' : ''} for &quot;
                  {debouncedQuery}&quot;
                </p>
              )}
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-medium text-sm">
                Showing {filteredScenarios.length} of {scenarios.length}{' '}
                Scenarios
              </p>
            </div>

            {/* Scenario Table */}
            {filteredScenarios.length === 0 ? (
              <div className="bg-medium border border-main rounded-lg p-12 text-center">
                <p className="text-dim text-lg mb-2">No Scenarios found</p>
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
                          Title
                        </th>
                        <th className="text-left px-4 py-3 text-main font-semibold text-sm hidden md:table-cell">
                          Category
                        </th>
                        <th className="text-left px-4 py-3 text-main font-semibold text-sm hidden lg:table-cell">
                          Description
                        </th>
                        <th className="text-left px-4 py-3 text-main font-semibold text-sm w-24">
                          Views
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredScenarios.map((scenario, index) => {
                        const isExpanded = expandedRows.has(scenario.id);

                        return (
                          <tr
                            key={scenario.id}
                            className={`border-b border-main/50 hover:bg-dim/30 transition-colors ${
                              index % 2 === 0 ? 'bg-medium' : 'bg-dim/10'
                            }`}
                          >
                            {/* Full row with expandable content */}
                            <td colSpan={5} className="p-0">
                              <div>
                                {/* Main row content */}
                                <div className="flex items-center">
                                  {/* Expand button */}
                                  <div className="px-4 py-3 w-12">
                                    <button
                                      onClick={() => toggleRow(scenario.id)}
                                      className="text-medium hover:text-main transition-colors"
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
                                  </div>

                                  {/* Title */}
                                  <div className="px-4 py-3 flex-1 min-w-0">
                                    <p className="text-main font-medium text-sm">
                                      {scenario.title}
                                    </p>
                                  </div>

                                  {/* Category - hidden on mobile */}
                                  <div className="px-4 py-3 hidden md:block flex-shrink-0">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                      {scenario.category}
                                    </span>
                                  </div>

                                  {/* Description - hidden on smaller screens */}
                                  <div className="px-4 py-3 hidden lg:block flex-1 min-w-0">
                                    <p className="text-dim text-sm truncate">
                                      {scenario.description || '—'}
                                    </p>
                                  </div>

                                  {/* Views */}
                                  <div className="px-4 py-3 w-24 flex-shrink-0">
                                    <div className="flex items-center gap-1 text-medium text-sm">
                                      <FiEye className="text-sm" />
                                      {scenario.viewCount}
                                    </div>
                                  </div>
                                </div>

                                {/* Expanded content */}
                                {isExpanded && (
                                  <div className="bg-content border-t border-main/50 p-6 animate-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-4">
                                      {/* Mobile-only category and description */}
                                      <div className="md:hidden space-y-2">
                                        <div>
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                            {scenario.category}
                                          </span>
                                        </div>
                                        {scenario.description && (
                                          <p className="text-dim text-sm">
                                            {scenario.description}
                                          </p>
                                        )}
                                      </div>

                                      {/* Full content */}
                                      <div>
                                        <h4 className="text-main font-semibold text-sm mb-2">
                                          Scenario Walkthrough:
                                        </h4>
                                        <div className="bg-medium border border-main rounded-lg p-4">
                                          <pre className="text-medium text-sm whitespace-pre-wrap font-mono leading-relaxed">
                                            {scenario.content}
                                          </pre>
                                        </div>
                                      </div>

                                      {/* Tags */}
                                      {scenario.tags.length > 0 && (
                                        <div>
                                          <h4 className="text-main font-semibold text-sm mb-2">
                                            Tags:
                                          </h4>
                                          <div className="flex flex-wrap gap-2">
                                            {scenario.tags.map((tag: string) => (
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
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
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
