'use client';

import { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Star } from 'lucide-react';
import { toZonedTime } from 'date-fns-tz';
import { useState, useEffect } from 'react';
import SectionSearchModal from '@/components/search/SectionSearchModal';
import { PageType } from '@prisma/client';
import TypewriterText from '@/components/TypewriterText';

type HomePageContent = {
  id: string;
  announcementText: string;
  gettingStartedText: string;
};

export default function HomePage() {
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchSection, setSearchSection] = useState<PageType | null>(null);
  const [announcementText, setAnnouncementText] = useState('Welcome! Check back here for important updates and announcements.');
  const [gettingStartedText, setGettingStartedText] = useState('Welcome to your home!');

  // Get PST time for greeting
  const pstDate = toZonedTime(new Date(), 'America/Los_Angeles');
  const hour = pstDate.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const handleSectionClick = (section: PageType) => {
    setSearchSection(section);
    setSearchModalOpen(true);
  };

  // Fetch home page content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/home-page-content');
        if (response.ok) {
          const data: HomePageContent = await response.json();
          setAnnouncementText(data.announcementText);
          setGettingStartedText(data.gettingStartedText);
        }
      } catch (error) {
        console.error('Failed to load home page content:', error);
      }
    };

    fetchContent();
  }, []);

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

        {/* Announcements - Moved above Quick Actions */}
        <div className="mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">
                Announcements
              </h3>
              <p className="text-base text-main leading-relaxed whitespace-pre-line">
                {announcementText}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-main mb-4 flex items-center gap-2">
            <Star size={20} className="text-dim" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
            <ActionButton
              title="Physician Directory"
              description="Hospital physician lookup"
              onClick={() => handleSectionClick(PageType.PHYSICIAN_DIRECTORY)}
            />
            <ActionButton
              title="Medications"
              description="Drug reference library"
              onClick={() => handleSectionClick(PageType.MEDICATION)}
            />
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-main mb-3">Getting Started</h3>
          <div className="space-y-2 text-sm text-medium whitespace-pre-line">
            {gettingStartedText}
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
