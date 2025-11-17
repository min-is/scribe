import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Clock, Star } from 'lucide-react';
import { utcToZonedTime } from 'date-fns-tz';

export const metadata: Metadata = {
  title: 'Home | Scribe Dashboard',
  description: 'Your medical scribe workspace',
};

export default async function HomePage() {
  // Get current hour in PST for greeting
  const now = new Date();
  const pstTime = utcToZonedTime(now, 'America/Los_Angeles');
  const hour = pstTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Welcome Header */}
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-main mb-3">
          {greeting}
        </h1>
        <p className="text-lg text-medium">
          Your comprehensive medical scribe documentation system
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <QuickAccessCard
          title="Providers"
          count={null}
          href="/providers"
        />
        <QuickAccessCard
          title="Procedures"
          count={null}
          href="/procedures"
        />
        <QuickAccessCard
          title="Smart Phrases"
          count={null}
          href="/smartphrases"
        />
        <QuickAccessCard
          title="Scenarios"
          count={null}
          href="/scenarios"
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
  );
}

function QuickAccessCard({
  title,
  count,
  href,
}: {
  title: string;
  count: number | null;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-main border border-main rounded-xl p-5 hover:shadow-hover hover:border-primary/50 transition-all"
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
    </Link>
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

function EmptyState({
  icon,
  message,
  description,
}: {
  icon: React.ReactNode;
  message: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-3">{icon}</div>
      <div className="font-medium text-main mb-1">{message}</div>
      <div className="text-sm text-dim">{description}</div>
    </div>
  );
}
