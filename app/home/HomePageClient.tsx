'use client';

import Link from 'next/link';
import { Clock, Star } from 'lucide-react';
import { toZonedTime } from 'date-fns-tz';
import { useState } from 'react';
import SectionSearchModal from '@/components/search/SectionSearchModal';
import { PageType } from '@prisma/client';
import TypewriterText from '@/components/TypewriterText';
import ScheduleCalendar from '@/components/calendar/ScheduleCalendar';

type HomePageClientProps = {
  initialContent: {
    announcementText: string;
    gettingStartedText: string;
  };
};

export default function HomePageClient({ initialContent }: HomePageClientProps) {
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

        {/* Announcements - Moved above Quick Actions */}
        <div className="mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/5 dark:to-purple-500/5 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            <div className="flex-1">
              <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5 uppercase tracking-wide">
                Announcements
              </h3>
              <p className="text-sm text-main leading-snug whitespace-pre-line">
                {initialContent.announcementText}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions and Calendar Section */}
        <div className="mb-10 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
          {/* Quick Actions - Left Column */}
          <div>
            <h2 className="text-xl font-semibold text-main mb-4 flex items-center gap-2">
              <Star size={20} className="text-dim" />
              Quick Actions
            </h2>
            <div className="flex flex-col gap-3">
              <ActionButton
                title="Provider Preferences"
                description="View provider preferences"
                onClick={() => handleSectionClick(PageType.PROVIDER)}
              />
              <ActionButton
                title="Procedures"
                description="Browse procedure documentation"
                onClick={() => handleSectionClick(PageType.PROCEDURE)}
              />
              <ActionButton
                title="Smart Phrases"
                description="Efficient .phrases"
                onClick={() => handleSectionClick(PageType.SMARTPHRASE)}
              />
              <ActionButton
                title="Scenarios"
                description="Documentation for various scenarios"
                onClick={() => handleSectionClick(PageType.SCENARIO)}
              />
              <ActionButton
                title="Physician Directory"
                description="Hospital physician lookup"
                onClick={() => handleSectionClick(PageType.PHYSICIAN_DIRECTORY)}
              />
              <ActionButton
                title="Medications"
                description="Extensive medication dictionary"
                onClick={() => handleSectionClick(PageType.MEDICATION)}
              />
            </div>
          </div>

          {/* Schedule Calendar - Right Column */}
          <div>
            <ScheduleCalendar />
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
      className="relative overflow-hidden bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-700/50 rounded-xl py-2.5 pl-3 pr-10 hover:bg-white dark:hover:bg-zinc-800 hover:border-zinc-300/70 dark:hover:border-zinc-600/70 hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-300 ease-out group text-left w-full active:scale-[0.98]"
    >
      <div className="flex flex-col">
        <div className="font-medium text-zinc-900 dark:text-zinc-100 text-sm mb-0.5 transition-colors duration-300">
          {title}
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{description}</div>
      </div>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </button>
  );
}
