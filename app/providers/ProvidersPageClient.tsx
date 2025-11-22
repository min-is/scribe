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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header Section */}
        <div className="mb-16 text-center">
          <h1 className="text-6xl font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
            Providers
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-light max-w-2xl mx-auto">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider) => (
              <div
                key={provider.id}
                onClick={() => handleProviderClick(provider.page?.slug || null)}
                className="group relative cursor-pointer"
              >
                {/* Frosted Glass Card */}
                <div className="relative overflow-hidden rounded-3xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm hover:shadow-xl transition-all duration-500 ease-out hover:scale-[1.02] hover:border-gray-300/80 dark:hover:border-gray-600/80">
                  {/* Gradient Background Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${getDifficultyColor(provider.generalDifficulty)} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  {/* Content */}
                  <div className="relative p-8">
                    {/* Icon */}
                    {provider.icon && (
                      <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-500">
                        {provider.icon}
                      </div>
                    )}

                    {/* Provider Name & Credentials */}
                    <div className="mb-6">
                      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1 tracking-tight">
                        {provider.name}
                      </h3>
                      {provider.credentials && (
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {provider.credentials}
                        </p>
                      )}
                    </div>

                    {/* Difficulty Badge */}
                    {provider.generalDifficulty && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          {/* Difficulty Bar */}
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-gray-400 to-gray-600 dark:from-gray-300 dark:to-gray-500 rounded-full transition-all duration-700"
                              style={{ width: `${(provider.generalDifficulty / 10) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                          {provider.generalDifficulty}/10
                        </div>
                      </div>
                    )}

                    {/* Difficulty Label */}
                    <div className="mt-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300">
                        {getDifficultyLabel(provider.generalDifficulty)}
                      </span>
                    </div>
                  </div>

                  {/* Hover Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
