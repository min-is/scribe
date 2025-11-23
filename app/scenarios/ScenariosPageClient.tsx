'use client';

import { useState, useMemo } from 'react';
import { Scenario, incrementScenarioViewCount } from '@/scenario/actions';
import {
  FiSearch,
  FiEye,
  FiX,
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
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

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

  const handleScenarioClick = async (scenario: Scenario) => {
    setSelectedScenario(scenario);
    // Track view when opening
    await incrementScenarioViewCount(scenario.id);
  };

  const handleClose = () => {
    setSelectedScenario(null);
  };

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: scenarios.length };
    scenarios.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [scenarios]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'All': 'from-gray-500/20 to-gray-600/20',
      'Emergency': 'from-red-500/20 to-rose-600/20',
      'Routine': 'from-green-500/20 to-emerald-600/20',
      'Trauma': 'from-orange-500/20 to-amber-600/20',
      'Pediatric': 'from-blue-500/20 to-cyan-600/20',
      'Surgical': 'from-purple-500/20 to-violet-600/20',
    };
    return colors[category] || 'from-green-500/20 to-emerald-600/20';
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3">
            Clinical Scenarios
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-light max-w-2xl mx-auto">
            Browse scenario walkthroughs for emergency and routine medical situations
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search by title, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl pl-14 pr-6 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-all shadow-sm"
            />
          </div>
          {debouncedQuery && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 text-center font-light">
              Found {filteredScenarios.length} result{filteredScenarios.length !== 1 ? 's' : ''} for &quot;{debouncedQuery}&quot;
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
          <p className="text-gray-500 dark:text-gray-400 text-sm font-light">
            Showing {filteredScenarios.length} of {scenarios.length} scenarios
          </p>
        </div>

        {/* Scenario Cards Grid */}
        {filteredScenarios.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500 dark:text-gray-400 text-lg font-light mb-2">
              No scenarios found
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredScenarios.map((scenario) => (
              <div
                key={scenario.id}
                onClick={() => handleScenarioClick(scenario)}
                className="group relative cursor-pointer"
              >
                {/* Frosted Glass Card */}
                <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all duration-300 ease-out hover:border-gray-300/80 dark:hover:border-gray-600/80">
                  {/* Gradient Background Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(scenario.category)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  {/* Content */}
                  <div className="relative p-5">
                    {/* Category Badge */}
                    <div className="mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                        {scenario.category}
                      </span>
                    </div>

                    {/* Scenario Title */}
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">
                      {scenario.title}
                    </h3>

                    {/* Description */}
                    {scenario.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-4 line-clamp-2">
                        {scenario.description}
                      </p>
                    )}

                    {/* View Count */}
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mb-3">
                      <FiEye className="text-sm" />
                      <span className="font-medium">{scenario.viewCount} views</span>
                    </div>

                    {/* Tags Preview */}
                    {scenario.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {scenario.tags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                        {scenario.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-gray-500 dark:text-gray-400">
                            +{scenario.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hover Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedScenario && (
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
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 mb-4">
                  {selectedScenario.category}
                </span>
                <h2 className="text-4xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">
                  {selectedScenario.title}
                </h2>
                {selectedScenario.description && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-light">
                    {selectedScenario.description}
                  </p>
                )}
              </div>

              <div className="space-y-6">
                {/* Scenario Content */}
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                  <h4 className="text-gray-900 dark:text-white font-semibold text-base mb-3">
                    Scenario Walkthrough
                  </h4>
                  <pre className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                    {selectedScenario.content}
                  </pre>
                </div>

                {/* Tags */}
                {selectedScenario.tags.length > 0 && (
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-semibold text-base mb-3">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedScenario.tags.map((tag: string) => (
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

                {/* View Count Statistics */}
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm flex items-center gap-2">
                    <FiEye className="text-lg" />
                    Viewed <span className="font-semibold text-gray-900 dark:text-white">{selectedScenario.viewCount}</span> times
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
