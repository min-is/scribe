'use client';

import { useEffect, useState } from 'react';
import { Physician } from '@prisma/client';
import { getPhysicianBySlug } from '@/physician';

export default function PhysicianProfileView() {
  const [physician, setPhysician] = useState<Physician | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleHashChange = async () => {
      const hash = window.location.hash;

      if (!hash || !hash.startsWith('#physician-')) {
        setPhysician(null);
        setError(null);
        return;
      }

      const slug = hash.substring(1); // Remove the #
      setIsLoading(true);
      setError(null);

      try {
        const data = await getPhysicianBySlug(slug);
        if (data) {
          setPhysician(data);
        } else {
          setError('Physician not found');
        }
      } catch (err) {
        setError('Failed to load physician profile');
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

  const handleClose = () => {
    window.location.hash = '';
    setPhysician(null);
    setError(null);
  };

  if (!physician && !isLoading && !error) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-main">Physician Profile</h2>
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
              <p className="text-dim mt-4">Loading physician profile...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {physician && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-xl font-semibold text-main">
                  {physician.name}
                </h3>
                {physician.credentials && (
                  <p className="text-dim mt-1">{physician.credentials}</p>
                )}
                {physician.specialty && (
                  <p className="text-dim mt-1">{physician.specialty}</p>
                )}
              </div>

              {/* Note Template */}
              {physician.noteTemplate && (
                <div>
                  <h4 className="text-lg font-medium text-main mb-2">
                    Note Template
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <pre className="text-sm text-main whitespace-pre-wrap font-mono">
                      {physician.noteTemplate}
                    </pre>
                  </div>
                </div>
              )}

              {/* Preferences */}
              {physician.preferences && (
                <div>
                  <h4 className="text-lg font-medium text-main mb-2">
                    Preferences
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <pre className="text-sm text-main whitespace-pre-wrap">
                      {JSON.stringify(physician.preferences, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {!physician.noteTemplate && !physician.preferences && (
                <div className="text-center py-8 text-dim">
                  <p>No additional information available for this physician.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
