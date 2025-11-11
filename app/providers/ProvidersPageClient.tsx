'use client';

import { Provider } from '@prisma/client';
import { ProviderDifficultyPreview } from '@/components/ProviderDifficultyPreview';

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

        {/* Provider Cards Grid */}
        {providers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-dim text-lg">No providers available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {providers.map((provider) => (
              <div
                key={provider.id}
                onClick={() => handleProviderClick(provider.slug)}
                className="bg-medium border border-main rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 group"
              >
                {/* Provider Info */}
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-main mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {provider.name}
                  </h3>
                  {provider.credentials && (
                    <p className="text-sm text-dim">{provider.credentials}</p>
                  )}
                </div>

                {/* Difficulty Preview */}
                <div className="flex justify-center py-4">
                  <ProviderDifficultyPreview
                    generalDifficulty={provider.generalDifficulty}
                    size="medium"
                    showLabel={true}
                  />
                </div>

                {/* View Profile Button */}
                <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
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
