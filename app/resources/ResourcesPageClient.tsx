'use client';

import { useState } from 'react';
import { FiBookOpen, FiX } from 'react-icons/fi';
import { ResourceSection } from '@/resource/types';
import dynamic from 'next/dynamic';

// Dynamically import TipTapEditor for read-only view
const TipTapEditor = dynamic(() => import('@/components/editor/TipTapEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
  ),
});

type ResourcesPageClientProps = {
  sections: ResourceSection[];
};

export default function ResourcesPageClient({ sections }: ResourcesPageClientProps) {
  const [selectedArticle, setSelectedArticle] = useState<{
    title: string;
    content: any;
    icon?: string | null;
  } | null>(null);

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

        {/* Resources by Section */}
        {sections.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500 dark:text-gray-400 text-lg font-normal">
              Resources coming soon! Check back for helpful articles and guides.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {sections.map((section) => {
              const articles = section.children || [];
              if (articles.length === 0) return null;

              return (
                <div key={section.id}>
                  {/* Section Header */}
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-2xl">{section.icon || '📁'}</span>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {section.title}
                    </h2>
                  </div>

                  {/* Articles Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {articles.map((article) => (
                      <div
                        key={article.id}
                        className="group relative cursor-pointer"
                        onClick={() =>
                          setSelectedArticle({
                            title: article.title,
                            content: article.content,
                            icon: article.icon,
                          })
                        }
                      >
                        {/* Frosted Glass Card */}
                        <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all duration-300 ease-out hover:border-gray-300/80 dark:hover:border-gray-600/80">
                          {/* Gradient Background Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-teal-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Content */}
                          <div className="relative p-5">
                            <div className="flex items-center gap-2 mb-2">
                              {article.icon && (
                                <span className="text-xl">{article.icon}</span>
                              )}
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
                                {article.title}
                              </h3>
                            </div>
                            {article.textContent && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                                {article.textContent.substring(0, 120)}
                                {article.textContent.length > 120 ? '...' : ''}
                              </p>
                            )}
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

        {/* Article Modal */}
        {selectedArticle && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedArticle(null)}
          >
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  {selectedArticle.icon && (
                    <span className="text-2xl">{selectedArticle.icon}</span>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedArticle.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <TipTapEditor
                  content={selectedArticle.content}
                  editable={false}
                  className="border-0 shadow-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
