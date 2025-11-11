'use client';

import { Physician } from '@prisma/client';
import PhysicianProfileView from '@/components/PhysicianProfileView';
import Link from 'next/link';

type HomePageClientProps = {
  physicians: Physician[];
};

export default function HomePageClient({ physicians }: HomePageClientProps) {
  return (
    <>
      <PhysicianProfileView />
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

            {/* Physician Preferences */}
            <div className="bg-medium border border-main rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-main">
                Physician Preferences
              </h2>
              <p className="text-dim">
                Access physician-specific note preferences and requirements.
              </p>
              <div className="pt-4 space-y-2">
                {physicians.length > 0 ? (
                  physicians.map((physician) => (
                    <a
                      key={physician.id}
                      href={`#${physician.slug}`}
                      className="block text-main hover:text-invert transition-colors"
                    >
                      {physician.name}
                    </a>
                  ))
                ) : (
                  <span className="text-sm text-medium">
                    No physicians added yet
                  </span>
                )}
              </div>
            </div>

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
