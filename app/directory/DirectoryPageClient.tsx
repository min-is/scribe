'use client';

import { PhysicianDirectory } from '@prisma/client';
import { useState, useMemo } from 'react';
import { FiSearch, FiUsers } from 'react-icons/fi';

interface DirectoryPageClientProps {
  physicians: PhysicianDirectory[];
}

export default function DirectoryPageClient({ physicians }: DirectoryPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');

  // Get unique specialties for filtering
  const specialties = useMemo(() => {
    const uniqueSpecialties = Array.from(new Set(physicians.map(p => p.specialty))).sort();
    return uniqueSpecialties;
  }, [physicians]);

  // Filter physicians based on search and specialty
  const filteredPhysicians = useMemo(() => {
    return physicians.filter(physician => {
      const matchesSearch = searchQuery === '' ||
        physician.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        physician.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        physician.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSpecialty = selectedSpecialty === 'all' || physician.specialty === selectedSpecialty;

      return matchesSearch && matchesSpecialty;
    });
  }, [physicians, searchQuery, selectedSpecialty]);

  // Group physicians by specialty for display
  const groupedPhysicians = useMemo(() => {
    const groups: Record<string, PhysicianDirectory[]> = {};
    filteredPhysicians.forEach(physician => {
      if (!groups[physician.specialty]) {
        groups[physician.specialty] = [];
      }
      groups[physician.specialty].push(physician);
    });
    return groups;
  }, [filteredPhysicians]);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/20 flex items-center justify-center">
              <FiUsers className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Physician Directory
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-normal ml-14">
            Search and browse hospital physicians by specialty
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="Search by name, specialty, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Specialty Filter */}
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-w-[200px]"
          >
            <option value="all">All Specialties</option>
            {specialties.map(specialty => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          {filteredPhysicians.length} physician{filteredPhysicians.length !== 1 ? 's' : ''} found
        </div>

        {/* Physicians List - Grouped by Specialty */}
        {Object.keys(groupedPhysicians).length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500 dark:text-gray-400 text-lg font-normal">
              No physicians found matching your search.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedPhysicians)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([specialty, physiciansList]) => (
                <div key={specialty}>
                  {/* Specialty Header */}
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    {specialty}
                  </h2>

                  {/* Physicians Grid - Compact Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {physiciansList.map(physician => (
                      <div
                        key={physician.id}
                        className="group relative p-4 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-lg hover:shadow-md hover:border-gray-300/80 dark:hover:border-gray-600/80 transition-all duration-200"
                      >
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
                          {physician.name}
                        </h3>
                        {physician.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {physician.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
