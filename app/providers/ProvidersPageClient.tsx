'use client';

import { Provider } from '@prisma/client';
import { ProviderDifficultyPreview } from '@/components/ProviderDifficultyPreview';
import ProviderProfileView from '@/components/ProviderProfileView';

interface ProvidersPageClientProps {
  providers: Provider[];
}

export default function ProvidersPageClient({
  providers,
}: ProvidersPageClientProps) {
  const handleProviderClick = (slug: string) => {
    // Navigate to provider profile using hash
    window.location.hash = `provider-${slug}`;
  };

  return (
    <>
      <ProviderProfileView />
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
                onClick={() => handleProviderClick(provider.slug)}
                className="bg-medium border border-main rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 group"
              >
                {/* Provider Info */}
                <div className="mb-3">
                  <h3 className="text-base font-semibold text-main mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {provider.name}
                  </h3>
                  {provider.credentials && (
                    <p className="text-xs text-dim">{provider.credentials}</p>
                  )}
                </div>

                {/* Difficulty Preview */}
                <div className="flex justify-center py-2">
                  <ProviderDifficultyPreview
                    generalDifficulty={provider.generalDifficulty}
                    size="small"
                    showLabel={true}
                  />
                </div>

                {/* View Profile Button */}
                <button className="w-full mt-3 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
