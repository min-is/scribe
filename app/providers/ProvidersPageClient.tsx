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
                  className="relative bg-medium border border-main rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
                  style={{
                    boxShadow: '0 0 0 0 transparent',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.2), 0 0 60px rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 0 0 0 transparent';
                    e.currentTarget.style.borderColor = '';
                  }}
                >
                  {/* Provider Info */}
                  <div className="mb-3">
                    <h3 className="text-base font-semibold text-main mb-0.5 group-hover:text-gray-100 dark:group-hover:text-white transition-colors line-clamp-2">
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
