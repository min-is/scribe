import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Workspace | Scribe Dashboard',
  description: 'Your medical scribe workspace',
};

export default async function WorkspacePage() {
  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Welcome Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-main mb-2">
          Welcome to Scribe Workspace
        </h1>
        <p className="text-xl text-dim">
          Your comprehensive medical scribe documentation system
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <QuickAction
          title="Provider Preferences"
          description="View all provider profiles and preferences"
          href="/providers"
        />
        <QuickAction
          title="Procedures"
          description="Browse procedure documentation"
          href="/procedures"
        />
        <QuickAction
          title="Smart Phrases"
          description="EPIC documentation templates"
          href="/smartphrases"
        />
      </div>

      {/* Page Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-main mb-6">Documentation Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CategoryCard
            icon="👨‍⚕️"
            title="Providers"
            href="/providers"
          />
          <CategoryCard
            icon="📋"
            title="Procedures"
            href="/procedures"
          />
          <CategoryCard
            icon="💬"
            title="Smart Phrases"
            href="/smartphrases"
          />
          <CategoryCard
            icon="🚨"
            title="Scenarios"
            href="/scenarios"
          />
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-medium border border-main rounded-lg p-6">
        <h3 className="text-xl font-semibold text-main mb-4">Getting Started</h3>
        <div className="space-y-3 text-dim">
          <p>
            <strong className="text-main">Welcome to your workspace!</strong> Here's what you can do:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Browse provider preferences and documentation</li>
            <li>Access procedure guides and protocols</li>
            <li>Find smart phrases for EPIC documentation</li>
            <li>Review critical scenarios and emergency protocols</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
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
      className="flex items-start gap-4 p-6 bg-medium border border-main rounded-lg hover:border-dim hover:shadow-lg transition-all"
    >
      <div>
        <h3 className="font-semibold text-main mb-1">{title}</h3>
        <p className="text-sm text-dim">{description}</p>
      </div>
    </Link>
  );
}

function CategoryCard({
  icon,
  title,
  href,
}: {
  icon: string;
  title: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-6 bg-medium border border-main rounded-lg hover:border-dim hover:shadow-lg transition-all text-center"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-semibold text-main mb-1">{title}</div>
    </Link>
  );
}
