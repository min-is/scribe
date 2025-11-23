'use client';

import { Provider } from '@prisma/client';
import { useRouter } from 'next/navigation';

interface ProvidersPageClientProps {
  providers: (Provider & { page: { slug: string } | null })[];
}

export default function ProvidersPageClient({
  providers,
}: ProvidersPageClientProps) {
  const router = useRouter();

  const handleProviderClick = (pageSlug: string | null) => {
    if (pageSlug) {
      // Navigate to the provider's page
      router.push(`/home/pages/${pageSlug}`);
    }
  };

  // Group providers by difficulty (if available)
  const getDifficultyLabel = (difficulty: number | null) => {
    if (!difficulty) return 'Not Rated';
    if (difficulty <= 3) return 'Beginner Friendly';
    if (difficulty <= 6) return 'Moderate';
    if (difficulty <= 8) return 'Advanced';
    return 'Expert Level';
  };

  const getDifficultyColor = (difficulty: number | null) => {
    if (!difficulty) return 'from-gray-500/20 to-gray-600/20';
    if (difficulty <= 3) return 'from-green-500/20 to-emerald-600/20';
    if (difficulty <= 6) return 'from-blue-500/20 to-cyan-600/20';
    if (difficulty <= 8) return 'from-orange-500/20 to-amber-600/20';
    return 'from-red-500/20 to-rose-600/20';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-gray-900 dark:text-white mb-3">
            Providers
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-light max-w-2xl mx-auto">
            Discover provider profiles, preferences, and expertise levels
          </p>
        </div>

        {/* Provider Cards Grid */}
        {providers.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-500 dark:text-gray-400 text-lg font-light">
              No providers available yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {providers.map((provider) => (
              <div
                key={provider.id}
                onClick={() => handleProviderClick(provider.page?.slug || null)}
                className="group relative cursor-pointer"
              >
                {/* Frosted Glass Card */}
                <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all duration-300 ease-out hover:border-gray-300/80 dark:hover:border-gray-600/80">
                  {/* Gradient Background Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getDifficultyColor(provider.generalDifficulty)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  {/* Content */}
                  <div className="relative p-5">
                    {/* Provider Name & Credentials */}
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-0.5 tracking-tight">
                        {provider.name}
                      </h3>
                      {provider.credentials && (
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {provider.credentials}
                        </p>
                      )}
                    </div>

                    {/* Difficulty Rating - Apple-inspired dot indicators */}
                    {provider.generalDifficulty && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: 10 }).map((_, index) => (
                            <div
                              key={index}
                              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                index < provider.generalDifficulty!
                                  ? 'bg-gray-800 dark:bg-gray-200'
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {getDifficultyLabel(provider.generalDifficulty)}
                          </span>
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-500 tabular-nums">
                            {provider.generalDifficulty}/10
                          </span>
                        </div>
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
    </div>
  );
}
