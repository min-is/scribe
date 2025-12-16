'use client';

import { FiBookOpen } from 'react-icons/fi';

export default function ResourcesPageClient() {
  // Placeholder resources - can be populated from database later
  const resources = [
    {
      id: '1',
      title: 'Navigating Epic',
      description: 'Learn the basics of Epic EMR navigation and essential shortcuts for efficient documentation.',
      category: 'Epic Training',
    },
    {
      id: '2',
      title: 'Creating Dot Phrases',
      description: 'Step-by-step guide to creating and managing custom dot phrases in Epic.',
      category: 'Epic Training',
    },
    {
      id: '3',
      title: 'Documentation Best Practices',
      description: 'Guidelines and tips for writing clear, concise, and compliant medical documentation.',
      category: 'Documentation',
    },
    {
      id: '4',
      title: 'Common Medical Abbreviations',
      description: 'Quick reference guide for frequently used medical abbreviations in the ED.',
      category: 'Reference',
    },
  ];

  const categories = Array.from(new Set(resources.map(r => r.category)));

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-lg shadow-green-500/20 flex items-center justify-center">
              <FiBookOpen className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Resources
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-normal ml-14">
            General help and information for scribes - Epic navigation, dot phrases, and documentation tips
          </p>
        </div>

        {/* Resources by Category */}
        {resources.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500 dark:text-gray-400 text-lg font-normal">
              Resources coming soon! Check back for helpful articles and guides.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map(category => {
              const categoryResources = resources.filter(r => r.category === category);
              return (
                <div key={category}>
                  {/* Category Header */}
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    {category}
                  </h2>

                  {/* Resources Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {categoryResources.map(resource => (
                      <div
                        key={resource.id}
                        className="group relative cursor-pointer"
                      >
                        {/* Frosted Glass Card */}
                        <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all duration-300 ease-out hover:border-gray-300/80 dark:hover:border-gray-600/80">
                          {/* Gradient Background Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-teal-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Content */}
                          <div className="relative p-5">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">
                              {resource.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                              {resource.description}
                            </p>
                          </div>

                          {/* Hover Shine Effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
