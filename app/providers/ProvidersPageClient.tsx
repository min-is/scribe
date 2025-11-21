'use client';

import { Provider } from '@prisma/client';
import { ProviderDifficultyPreview } from '@/components/ProviderDifficultyPreview';
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

  return (
    <>
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-main mb-2">
              Provider Preferences
            </h1>
            <p className="text-dim text-lg">
              Browse provider profiles, preferences, and difficulty ratings
            </p>
          </div>

          {/* Provider Cards Grid - Smaller tiles */}
          {providers.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-dim text-lg">No providers available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  onClick={() => handleProviderClick(provider.page?.slug || null)}
                  className="relative bg-black dark:bg-black border border-white/20 dark:border-white/20 rounded-lg p-4 hover:border-white/40 dark:hover:border-white/40 transition-all duration-200 cursor-pointer group overflow-hidden"
                >
                  {/* Provider Info */}
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-white mb-0.5 line-clamp-2">
                      {provider.name}
                    </h3>
                    {provider.credentials && (
                      <p className="text-xs text-gray-400">{provider.credentials}</p>
                    )}
                  </div>

                  {/* Difficulty Preview */}
                  <div className="flex justify-center py-2">
                    <ProviderDifficultyPreview
                      generalDifficulty={provider.generalDifficulty}
                      size="xs"
                      showLabel={true}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
