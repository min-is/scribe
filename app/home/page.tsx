'use client';

import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Star } from 'lucide-react';
import { toZonedTime } from 'date-fns-tz';
import { useState } from 'react';
import SectionSearchModal from '@/components/search/SectionSearchModal';
import { PageType } from '@prisma/client';
import TypewriterText from '@/components/TypewriterText';

export default function HomePage() {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchSection, setSearchSection] = useState<PageType | null>(null);

  // Get PST time for greeting
  const pstDate = toZonedTime(new Date(), 'America/Los_Angeles');
  const hour = pstDate.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const handleSectionClick = (section: PageType) => {
    setSearchSection(section);
    setSearchModalOpen(true);
  };

  return (
    <>
      <div className="max-w-6xl mx-auto p-8">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-main mb-3">
            {greeting}
          </h1>
          <div className="text-lg text-medium">
            <TypewriterText />
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <QuickAccessCard
            title="Providers"
            count={null}
            onClick={() => handleSectionClick(PageType.PROVIDER)}
          />
          <QuickAccessCard
            title="Procedures"
            count={null}
            onClick={() => handleSectionClick(PageType.PROCEDURE)}
          />
          <QuickAccessCard
            title="Smart Phrases"
            count={null}
            onClick={() => handleSectionClick(PageType.SMARTPHRASE)}
          />
          <QuickAccessCard
            title="Scenarios"
            count={null}
            onClick={() => handleSectionClick(PageType.SCENARIO)}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-main mb-4 flex items-center gap-2">
            <Star size={20} className="text-dim" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <ActionButton
              title="Provider Preferences"
              description="View provider profiles"
              onClick={() => handleSectionClick(PageType.PROVIDER)}
            />
            <ActionButton
              title="Procedures"
              description="Browse protocols"
              onClick={() => handleSectionClick(PageType.PROCEDURE)}
            />
            <ActionButton
              title="Smart Phrases"
              description="EPIC templates"
              onClick={() => handleSectionClick(PageType.SMARTPHRASE)}
            />
            <ActionButton
              title="Scenarios"
              description="Emergency protocols"
              onClick={() => handleSectionClick(PageType.SCENARIO)}
            />
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-main mb-3">Getting Started</h3>
          <div className="space-y-2 text-sm text-medium">
            <p className="font-medium text-main">Welcome to your home!</p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Browse provider preferences and documentation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Access procedure guides and protocols</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Find smart phrases for EPIC documentation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Review critical scenarios and emergency protocols</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section Search Modal */}
      {searchModalOpen && searchSection && (
        <SectionSearchModal
          isOpen={searchModalOpen}
          onClose={() => {
            setSearchModalOpen(false);
            setSearchSection(null);
          }}
          section={searchSection}
        />
      )}
    </>
  );
}

function QuickAccessCard({
  title,
  count,
  onClick,
}: {
  title: string;
  count: number | null;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group bg-main border border-main rounded-xl p-5 hover:shadow-hover hover:border-primary/50 transition-all text-left w-full"
    >
      <div className="flex items-center justify-between mb-2">
        {count !== null && (
          <span className="text-2xl font-bold text-dim group-hover:text-primary transition-colors">
            {count}
          </span>
        )}
      </div>
      <div className="font-semibold text-main group-hover:text-primary transition-colors">
        {title}
      </div>
    </button>
  );
}

function ActionButton({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="block bg-main border border-main rounded-lg p-4 hover:shadow-soft hover:border-primary/50 transition-all group text-left w-full"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-main text-sm mb-0.5 group-hover:text-primary transition-colors">
            {title}
          </div>
          <div className="text-xs text-dim">{description}</div>
        </div>
      </div>
    </button>
  );
}
