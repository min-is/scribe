'use client';

import { useState, useMemo } from 'react';
import { ScenarioListItem, incrementScenarioViewCount, getScenarioContent } from '@/scenario/actions';
import {
  FiSearch,
  FiFileText,
} from 'react-icons/fi';
import { useDebounce } from 'use-debounce';
import { EditorRenderer } from '@/components/editor/EditorRenderer';
import CloseButton from '@/components/primitives/CloseButton';

interface ScenariosPageClientProps {
  scenarios: ScenarioListItem[];
  categories: string[];
}

interface SelectedScenario extends ScenarioListItem {
  content?: any;
}

export default function ScenariosPageClient({
  scenarios,
  categories,
}: ScenariosPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedScenario, setSelectedScenario] = useState<SelectedScenario | null>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Filter scenarios based on search and category
  const filteredScenarios = useMemo(() => {
    let filtered = scenarios;

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((s) => s.category === selectedCategory);
    }

    // Filter by search query (searches title, category, description, and tags)
    if (debouncedQuery.trim()) {
      const query = debouncedQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.slug.toLowerCase().includes(query) ||
          s.title.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query) ||
          s.tags.some((tag: string) => tag.toLowerCase().includes(query)),
      );
    }

    return filtered;
  }, [scenarios, selectedCategory, debouncedQuery]);

  const handleScenarioClick = async (scenario: ScenarioListItem) => {
    // Set scenario immediately for responsive UI
    setSelectedScenario({ ...scenario, content: null });
    setIsLoadingContent(true);

    // Fetch content and track view in parallel
    const [contentResult] = await Promise.all([
      getScenarioContent(scenario.id),
      incrementScenarioViewCount(scenario.id),
    ]);

    if (contentResult) {
      setSelectedScenario({ ...scenario, content: contentResult.content });
    }
    setIsLoadingContent(false);
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
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/20 flex items-center justify-center">
              <FiFileText className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
              ED Scenarios
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-normal ml-14">
            Browse scenario walkthroughs for various ED events
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
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 text-center font-normal">
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
          <p className="text-gray-500 dark:text-gray-400 text-sm font-normal">
            Showing {filteredScenarios.length} of {scenarios.length} scenarios
          </p>
        </div>

        {/* Scenario Cards Grid */}
        {filteredScenarios.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500 dark:text-gray-400 text-lg font-normal mb-2">
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
                className="group relative cursor-pointer h-full"
              >
                {/* Frosted Glass Card */}
                <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all duration-300 ease-out hover:border-gray-300/80 dark:hover:border-gray-600/80 h-full flex flex-col">
                  {/* Gradient Background Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(scenario.category)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  {/* Content */}
                  <div className="relative p-5 flex flex-col flex-1">
                    {/* Category Badge */}
                    <div className="mb-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                        {scenario.category}
                      </span>
                    </div>

                    {/* Scenario Title */}
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 tracking-tight line-clamp-2">
                      {scenario.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-normal mb-4 line-clamp-2 flex-1">
                      {scenario.description || 'No description available'}
                    </p>

                    {/* Tags Preview */}
                    <div className="flex flex-wrap gap-1.5 mt-auto min-h-[28px]">
                      {scenario.tags.length > 0 ? (
                        <>
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
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 dark:text-gray-500">No tags</span>
                      )}
                    </div>
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
            <div className="sticky top-4 float-right mr-4 mt-4 z-10">
              <CloseButton size="lg" onClick={handleClose} />
            </div>

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
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-normal">
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
                  <div className="prose dark:prose-invert max-w-none">
                    {isLoadingContent ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      </div>
                    ) : selectedScenario.content ? (
                      <EditorRenderer content={selectedScenario.content} />
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">No content available</p>
                    )}
                  </div>
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
