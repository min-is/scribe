'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import SectionSearchModal from '@/components/search/SectionSearchModal';
import TypewriterText from '@/components/TypewriterText';

type SectionType = 'PROVIDER' | 'PROCEDURE' | 'SMARTPHRASE' | 'SCENARIO' | null;

interface AnimatedMessage {
  id: string;
  message: string;
  order: number;
  enabled: boolean;
}

interface HomePageClientProps {
  greeting: string;
}

export default function HomePageClient({ greeting }: HomePageClientProps) {
  const [activeModal, setActiveModal] = useState<SectionType>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  // Fetch animated messages
  useEffect(() => {
    async function fetchMessages() {
      try {
        const response = await fetch('/api/animated-messages?enabled=true');
        if (response.ok) {
          const data: AnimatedMessage[] = await response.json();
          const messageTexts = data.map((m) => m.message);
          setMessages(messageTexts.length > 0 ? messageTexts : ['Your comprehensive medical scribe documentation system']);
        } else {
          setMessages(['Your comprehensive medical scribe documentation system']);
        }
      } catch (error) {
        console.error('Error fetching animated messages:', error);
        setMessages(['Your comprehensive medical scribe documentation system']);
      } finally {
        setIsLoadingMessages(false);
      }
    }
    fetchMessages();
  }, []);

  return (
    <>
      <div className="max-w-6xl mx-auto p-8">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-main mb-3">
            {greeting}
          </h1>
          <p className="text-lg text-medium min-h-[28px]">
            {isLoadingMessages ? (
              'Your comprehensive medical scribe documentation system'
            ) : (
              <TypewriterText messages={messages} className="text-medium" />
            )}
          </p>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <QuickAccessCard
            title="Providers"
            onClick={() => setActiveModal('PROVIDER')}
          />
          <QuickAccessCard
            title="Procedures"
            onClick={() => setActiveModal('PROCEDURE')}
          />
          <QuickAccessCard
            title="Smart Phrases"
            onClick={() => setActiveModal('SMARTPHRASE')}
          />
          <QuickAccessCard
            title="Scenarios"
            onClick={() => setActiveModal('SCENARIO')}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-main mb-4 flex items-center gap-2">
            <Star size={20} className="text-dim" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <ActionButton
              title="Provider Preferences"
              description="View provider profiles"
              href="/providers"
            />
            <ActionButton
              title="Procedures"
              description="Browse protocols"
              href="/procedures"
            />
            <ActionButton
              title="Smart Phrases"
              description="EPIC templates"
              href="/smartphrases"
            />
            <ActionButton
              title="Scenarios"
              description="Emergency protocols"
              href="/scenarios"
            />
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-10 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-main mb-3">Getting Started</h3>
          <div className="space-y-2 text-sm text-medium">
            <p className="font-medium text-main">Welcome to your workspace!</p>
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

      {/* Section Search Modals */}
      <SectionSearchModal
        isOpen={activeModal === 'PROVIDER'}
        onClose={() => setActiveModal(null)}
        sectionType="PROVIDER"
        sectionTitle="Providers"
      />
      <SectionSearchModal
        isOpen={activeModal === 'PROCEDURE'}
        onClose={() => setActiveModal(null)}
        sectionType="PROCEDURE"
        sectionTitle="Procedures"
      />
      <SectionSearchModal
        isOpen={activeModal === 'SMARTPHRASE'}
        onClose={() => setActiveModal(null)}
        sectionType="SMARTPHRASE"
        sectionTitle="Smart Phrases"
      />
      <SectionSearchModal
        isOpen={activeModal === 'SCENARIO'}
        onClose={() => setActiveModal(null)}
        sectionType="SCENARIO"
        sectionTitle="Scenarios"
      />
    </>
  );
}

function QuickAccessCard({
  title,
  onClick,
}: {
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group bg-main border border-main rounded-xl p-5 hover:shadow-hover hover:border-primary/50 transition-all text-left w-full"
    >
      <div className="font-semibold text-main group-hover:text-primary transition-colors">
        {title}
      </div>
    </button>
  );
}

function ActionButton({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-main border border-main rounded-lg p-4 hover:shadow-soft hover:border-primary/50 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-main text-sm mb-0.5 group-hover:text-primary transition-colors">
            {title}
          </div>
          <div className="text-xs text-dim">{description}</div>
        </div>
      </div>
    </Link>
  );
}
