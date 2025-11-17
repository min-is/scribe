'use client';

import { useState, useMemo } from 'react';
import { Procedure, incrementProcedureViewCount } from '@/procedure/actions';
import {
  FiSearch,
  FiChevronDown,
  FiChevronRight,
  FiEye,
  FiAlertCircle,
  FiCheckCircle,
  FiTool,
  FiList,
  FiAlertTriangle,
} from 'react-icons/fi';
import { useDebounce } from 'use-debounce';

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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

  const toggleRow = async (id: string) => {
    const newExpanded = new Set(expandedRows);
    const wasExpanded = newExpanded.has(id);

    if (wasExpanded) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
      // Track view when expanding
      await incrementProcedureViewCount(id);
    }
    setExpandedRows(newExpanded);
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
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-main mb-2">
            Medical Procedures
          </h1>
          <p className="text-dim text-lg">
            Step-by-step guides for medical procedures with indications, contraindications, and equipment
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
                  placeholder="Search by title, category, or steps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-medium border border-main rounded-lg pl-12 pr-4 py-3 text-main placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              {debouncedQuery && (
                <p className="text-dim text-sm mt-2">
                  Found {filteredProcedures.length} result
                  {filteredProcedures.length !== 1 ? 's' : ''} for &quot;
                  {debouncedQuery}&quot;
                </p>
              )}
            </div>

            {/* Results Count */}
            <div className="mb-4">
              <p className="text-medium text-sm">
                Showing {filteredProcedures.length} of {procedures.length}{' '}
                Procedures
              </p>
            </div>

            {/* Procedure Table */}
            {filteredProcedures.length === 0 ? (
              <div className="bg-medium border border-main rounded-lg p-12 text-center">
                <p className="text-dim text-lg mb-2">No Procedures found</p>
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
                          Procedure
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
                      {filteredProcedures.map((procedure, index) => {
                        const isExpanded = expandedRows.has(procedure.id);

                        return (
                          <>
                            <tr
                              key={procedure.id}
                              className={`border-b border-main/50 hover:bg-dim/30 transition-colors ${
                                index % 2 === 0 ? 'bg-medium' : 'bg-dim/10'
                              }`}
                            >
                              {/* Expand button */}
                              <td className="px-4 py-3 w-12">
                                <button
                                  onClick={() => toggleRow(procedure.id)}
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

                              {/* Title */}
                              <td className="px-4 py-3">
                                <p className="text-main font-medium text-sm">
                                  {procedure.title}
                                </p>
                              </td>

                              {/* Category - hidden on mobile */}
                              <td className="px-4 py-3 hidden md:table-cell">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                  {procedure.category}
                                </span>
                              </td>

                              {/* Description - hidden on smaller screens */}
                              <td className="px-4 py-3 hidden lg:table-cell">
                                <p className="text-dim text-sm truncate">
                                  {procedure.description || '—'}
                                </p>
                              </td>

                              {/* Views */}
                              <td className="px-4 py-3 w-24">
                                <div className="flex items-center gap-1 text-medium text-sm">
                                  <FiEye className="text-sm" />
                                  {procedure.viewCount}
                                </div>
                              </td>
                            </tr>

                            {/* Expanded content row */}
                            {isExpanded && (
                              <tr key={`${procedure.id}-expanded`}>
                                <td colSpan={5} className="p-0">
                                  <div className="bg-content border-t border-main/50 p-6 animate-in slide-in-from-top-2 duration-200">
                                    <div className="space-y-6">
                                      {/* Mobile-only category and description */}
                                      <div className="md:hidden space-y-2">
                                        <div>
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                            {procedure.category}
                                          </span>
                                        </div>
                                        {procedure.description && (
                                          <p className="text-dim text-sm">
                                            {procedure.description}
                                          </p>
                                        )}
                                      </div>

                                      {/* Indications */}
                                      {procedure.indications && (
                                        <div>
                                          <h4 className="text-main font-semibold text-sm mb-2 flex items-center gap-2">
                                            <FiCheckCircle className="text-green-400" />
                                            Indications:
                                          </h4>
                                          <div className="bg-medium border border-main rounded-lg p-4">
                                            <pre className="text-medium text-sm whitespace-pre-wrap font-mono leading-relaxed">
                                              {procedure.indications}
                                            </pre>
                                          </div>
                                        </div>
                                      )}

                                      {/* Contraindications */}
                                      {procedure.contraindications && (
                                        <div>
                                          <h4 className="text-main font-semibold text-sm mb-2 flex items-center gap-2">
                                            <FiAlertCircle className="text-red-400" />
                                            Contraindications:
                                          </h4>
                                          <div className="bg-medium border border-main rounded-lg p-4">
                                            <pre className="text-medium text-sm whitespace-pre-wrap font-mono leading-relaxed">
                                              {procedure.contraindications}
                                            </pre>
                                          </div>
                                        </div>
                                      )}

                                      {/* Equipment */}
                                      {procedure.equipment && (
                                        <div>
                                          <h4 className="text-main font-semibold text-sm mb-2 flex items-center gap-2">
                                            <FiTool className="text-blue-400" />
                                            Equipment/Supplies:
                                          </h4>
                                          <div className="bg-medium border border-main rounded-lg p-4">
                                            <pre className="text-medium text-sm whitespace-pre-wrap font-mono leading-relaxed">
                                              {procedure.equipment}
                                            </pre>
                                          </div>
                                        </div>
                                      )}

                                      {/* Steps */}
                                      <div>
                                        <h4 className="text-main font-semibold text-sm mb-2 flex items-center gap-2">
                                          <FiList className="text-purple-400" />
                                          Procedure Steps:
                                        </h4>
                                        <div className="bg-medium border border-main rounded-lg p-4">
                                          <pre className="text-medium text-sm whitespace-pre-wrap font-mono leading-relaxed">
                                            {procedure.steps}
                                          </pre>
                                        </div>
                                      </div>

                                      {/* Complications */}
                                      {procedure.complications && (
                                        <div>
                                          <h4 className="text-main font-semibold text-sm mb-2 flex items-center gap-2">
                                            <FiAlertTriangle className="text-yellow-400" />
                                            Potential Complications:
                                          </h4>
                                          <div className="bg-medium border border-main rounded-lg p-4">
                                            <pre className="text-medium text-sm whitespace-pre-wrap font-mono leading-relaxed">
                                              {procedure.complications}
                                            </pre>
                                          </div>
                                        </div>
                                      )}

                                      {/* Tags */}
                                      {procedure.tags.length > 0 && (
                                        <div>
                                          <h4 className="text-main font-semibold text-sm mb-2">
                                            Tags:
                                          </h4>
                                          <div className="flex flex-wrap gap-2">
                                            {procedure.tags.map((tag: string) => (
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
