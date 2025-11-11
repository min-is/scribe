'use client';

import { useEffect, useState } from 'react';
import { Provider } from '@prisma/client';
import {
  getProviderBySlug,
  incrementProviderViewCount,
} from '@/provider/actions';
import { ProviderDifficultyFull } from './ProviderDifficultyFull';

export default function ProviderProfileView() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;

      if (!hash || !hash.startsWith('#provider-')) {
        handleCloseAnimation();
        return;
      }

      // Extract just the slug part (remove #provider- prefix)
      const slug = hash.replace('#provider-', '');
      setIsLoading(true);
      setError(null);
      setIsVisible(true);

      try {
        const data = await getProviderBySlug(slug);
        if (data) {
          setProvider(data);
          // Track view count when profile is opened
          incrementProviderViewCount(slug);
        } else {
          setError('Provider not found');
        }
      } catch (err) {
        setError('Failed to load provider profile');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handleCloseAnimation = () => {
    setIsClosing(true);
    setTimeout(() => {
      setProvider(null);
      setError(null);
      setIsVisible(false);
      setIsClosing(false);
    }, 200); // Match animation duration
  };

  const handleClose = () => {
    window.location.hash = '';
  };

  if (!isVisible && !provider && !isLoading && !error) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${
        isClosing ? 'bg-black/0' : 'bg-black/50'
      } ${!isClosing && isVisible ? 'animate-in fade-in' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto transition-all duration-200 ${
          isClosing
            ? 'scale-95 opacity-0'
            : 'scale-100 opacity-100 animate-in zoom-in-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-main">Provider Profile</h2>
          <button
            onClick={handleClose}
            className="text-dim hover:text-main transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="text-dim mt-4">Loading provider profile...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {provider && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-2xl font-semibold text-main">
                  {provider.name}
                </h3>
                {provider.credentials && (
                  <p className="text-dim mt-1 text-lg">{provider.credentials}</p>
                )}
              </div>

              {/* Difficulty Metrics */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="text-lg font-medium text-main mb-4">
                  Difficulty Metrics
                </h4>
                <ProviderDifficultyFull
                  generalDifficulty={provider.generalDifficulty}
                  speedDifficulty={provider.speedDifficulty}
                  terminologyDifficulty={provider.terminologyDifficulty}
                  noteDifficulty={provider.noteDifficulty}
                />
              </div>

              {/* Preferences (Note Template) */}
              {provider.noteTemplate && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-lg font-medium text-main mb-2">
                    Preferences
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <pre className="text-sm text-main whitespace-pre-wrap font-mono">
                      {provider.noteTemplate}
                    </pre>
                  </div>
                </div>
              )}

              {/* Note SmartPhrase */}
              {provider.noteSmartPhrase ? (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-lg font-medium text-main mb-2">
                    Note SmartPhrase
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <pre className="text-sm text-main whitespace-pre-wrap font-mono">
                      {provider.noteSmartPhrase}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-lg font-medium text-main mb-2">
                    Note SmartPhrase
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <p className="text-sm text-dim">No note smartphrases</p>
                  </div>
                </div>
              )}

              {/* Additional Preferences (JSON) */}
              {provider.preferences && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h4 className="text-lg font-medium text-main mb-2">
                    Preferences
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <pre className="text-sm text-main whitespace-pre-wrap">
                      {JSON.stringify(provider.preferences, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {!provider.noteTemplate &&
                !provider.preferences &&
                !provider.generalDifficulty &&
                !provider.speedDifficulty &&
                !provider.terminologyDifficulty &&
                !provider.noteDifficulty && (
                  <div className="text-center py-8 text-dim">
                    <p>No additional information available for this provider.</p>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
