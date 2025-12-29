'use client';

import { useState, useMemo } from 'react';
import { Procedure, incrementProcedureViewCount } from '@/procedure/actions';
import {
  FiSearch,
  FiList,
  FiAlertTriangle,
  FiX,
  FiClipboard,
} from 'react-icons/fi';
import { useDebounce } from 'use-debounce';
import { EditorRenderer } from '@/components/editor/EditorRenderer';

interface ProceduresPageClientProps {
  procedures: Procedure[];
  categories: string[];
}

export default function ProceduresPageClient({
  procedures,
  categories,
}: ProceduresPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);

  // Filter procedures based on search and category
  const filteredProcedures = useMemo(() => {
    let filtered = procedures;

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
          p.steps.toLowerCase().includes(query) ||
          p.tags.some((tag: string) => tag.toLowerCase().includes(query)),
      );
    }

    return filtered;
  }, [procedures, selectedCategory, debouncedQuery]);

  const handleProcedureClick = async (procedure: Procedure) => {
    setSelectedProcedure(procedure);
    // Track view when opening
    await incrementProcedureViewCount(procedure.id);
  };

  const handleClose = () => {
    setSelectedProcedure(null);
  };

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: procedures.length };
    procedures.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [procedures]);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg shadow-purple-500/20 flex items-center justify-center">
              <FiClipboard className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
              ED Procedures
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-normal ml-14">
            Documentation guide for ED procedures
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search by title, category, or steps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl pl-14 pr-6 py-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-all shadow-sm"
            />
          </div>
          {debouncedQuery && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 text-center font-normal">
              Found {filteredProcedures.length} result{filteredProcedures.length !== 1 ? 's' : ''} for &quot;{debouncedQuery}&quot;
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
            Showing {filteredProcedures.length} of {procedures.length} procedures
          </p>
        </div>

        {/* Procedure List */}
        {filteredProcedures.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500 dark:text-gray-400 text-lg font-normal mb-2">
              No procedures found
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl overflow-hidden divide-y divide-gray-200/50 dark:divide-gray-700/50">
              {filteredProcedures.map((procedure) => (
                <div
                  key={procedure.id}
                  onClick={() => handleProcedureClick(procedure)}
                  className="group cursor-pointer px-5 py-4 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors duration-150"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
                          {procedure.title}
                        </h3>
                        <span className="flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          {procedure.category}
                        </span>
                      </div>
                      {procedure.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {procedure.description}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedProcedure && (
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
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 mb-4">
                  {selectedProcedure.category}
                </span>
                <h2 className="text-4xl font-semibold text-gray-900 dark:text-white mb-3 tracking-tight">
                  {selectedProcedure.title}
                </h2>
                {selectedProcedure.description && (
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-normal">
                    {selectedProcedure.description}
                  </p>
                )}
              </div>

              <div className="space-y-6">
                {/* Steps */}
                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-2xl p-6">
                  <h4 className="text-gray-900 dark:text-white font-semibold text-base mb-3 flex items-center gap-2">
                    <FiList className="text-purple-600 dark:text-purple-400" />
                    Procedure Steps
                  </h4>
                  <div className="prose dark:prose-invert max-w-none">
                    <EditorRenderer content={selectedProcedure.steps} />
                  </div>
                </div>

                {/* Complications */}
                {selectedProcedure.complications && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
                    <h4 className="text-gray-900 dark:text-white font-semibold text-base mb-3 flex items-center gap-2">
                      <FiAlertTriangle className="text-yellow-600 dark:text-yellow-500" />
                      Potential Complications
                    </h4>
                    <pre className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                      {selectedProcedure.complications}
                    </pre>
                  </div>
                )}

                {/* Tags */}
                {selectedProcedure.tags.length > 0 && (
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-semibold text-base mb-3">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProcedure.tags.map((tag: string) => (
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
