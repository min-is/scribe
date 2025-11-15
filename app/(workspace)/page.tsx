import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, FolderOpen, Plus, TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Workspace | Scribe Dashboard',
  description: 'Your medical scribe workspace',
};

export default async function WorkspaceHomePage() {
  // TODO: Fetch recent pages, stats, etc.

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
          icon={<Plus className="text-blue-500" size={24} />}
          title="New Page"
          description="Create a new documentation page"
          href="/pages/new"
        />
        <QuickAction
          icon={<FileText className="text-green-500" size={24} />}
          title="Browse Pages"
          description="View all your pages"
          href="/pages"
        />
        <QuickAction
          icon={<FolderOpen className="text-purple-500" size={24} />}
          title="Provider Profiles"
          description="Emergency Department providers"
          href="/pages?type=PROVIDER"
        />
      </div>

      {/* Page Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-main mb-6">Documentation Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CategoryCard
            icon="👨‍⚕️"
            title="Providers"
            count={0}
            href="/pages?type=PROVIDER"
          />
          <CategoryCard
            icon="📋"
            title="Procedures"
            count={0}
            href="/pages?type=PROCEDURE"
          />
          <CategoryCard
            icon="💬"
            title="Smart Phrases"
            count={0}
            href="/pages?type=SMARTPHRASE"
          />
          <CategoryCard
            icon="🚨"
            title="Scenarios"
            count={0}
            href="/pages?type=SCENARIO"
          />
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-medium border border-main rounded-lg p-6">
        <h3 className="text-xl font-semibold text-main mb-4">Getting Started</h3>
        <div className="space-y-3 text-dim">
          <p>
            <strong className="text-main">New to the workspace?</strong> Here's how to get started:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Create pages for provider preferences, procedures, and protocols</li>
            <li>Organize pages hierarchically with subpages</li>
            <li>Use the sidebar to navigate your documentation</li>
            <li>Search across all pages with Cmd+K</li>
          </ul>
          <Link
            href="/pages/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Create Your First Page
          </Link>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 p-6 bg-medium border border-main rounded-lg hover:border-dim hover:shadow-lg transition-all"
    >
      <div className="flex-shrink-0">{icon}</div>
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
  count,
  href,
}: {
  icon: string;
  title: string;
  count: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center p-6 bg-medium border border-main rounded-lg hover:border-dim hover:shadow-lg transition-all text-center"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-semibold text-main mb-1">{title}</div>
      <div className="text-2xl font-bold text-main">{count}</div>
      <div className="text-xs text-dim">pages</div>
    </Link>
  );
}
