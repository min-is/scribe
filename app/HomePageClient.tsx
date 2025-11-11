'use client';

import ProviderProfileView from '@/components/ProviderProfileView';
import Link from 'next/link';

export default function HomePageClient() {
  return (
    <>
      <ProviderProfileView />
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-main">Scribe Dashboard</h1>
            <p className="text-xl text-dim">
              Your comprehensive resource for medical scribing
            </p>
          </div>

          {/* Dashboard Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {/* Physician Schedules */}
            <div className="bg-medium border border-main rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-main">
                Physician Schedules
              </h2>
              <p className="text-dim">
                View and manage physician schedules and availability.
              </p>
              <div className="pt-4">
                <span className="text-sm text-medium">Coming soon...</span>
              </div>
            </div>

            {/* Provider Preferences */}
            <Link
              href="/providers"
              className="bg-medium border border-main rounded-lg p-6 space-y-4 hover:border-blue-500 dark:hover:border-blue-400 transition-all hover:shadow-lg block group"
            >
              <h2 className="text-2xl font-semibold text-main group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Provider Preferences
              </h2>
              <p className="text-dim">
                View all provider profiles, preferences, and difficulty ratings.
              </p>
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                  Browse Providers
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </Link>

            {/* EPIC Dot Phrases */}
            <div className="bg-medium border border-main rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-main">
                EPIC Dot Phrases
              </h2>
              <p className="text-dim">
                Common dot phrases and templates for EPIC documentation.
              </p>
              <div className="pt-4">
                <span className="text-sm text-medium">Coming soon...</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-12 p-6 bg-dim border border-main rounded-lg">
            <h2 className="text-xl font-semibold text-main mb-4">
              Quick Links
            </h2>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/sign-in"
                className="text-main hover:text-invert transition-colors"
              >
                Sign In
              </Link>
              <span className="text-medium">•</span>
              <Link
                href="/admin"
                className="text-main hover:text-invert transition-colors"
              >
                Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
