import { Metadata } from 'next';
import Link from 'next/link';
import { Plus, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'All Pages',
  description: 'Browse all your pages',
};

export default async function PagesIndexPage() {
  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold text-main">All Pages</h1>
          <Link
            href="/pages/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            New Page
          </Link>
        </div>
        <p className="text-dim">
          Browse and manage all your documentation pages
        </p>
      </div>

      {/* Page Type Sections */}
      <div className="space-y-8">
        <PageTypeSection
          title="Provider Preferences"
          description="Emergency Department provider profiles and preferences"
          type="PROVIDER"
          icon="👨‍⚕️"
        />

        <PageTypeSection
          title="Procedures"
          description="Step-by-step procedure documentation"
          type="PROCEDURE"
          icon="📋"
        />

        <PageTypeSection
          title="Smart Phrases"
          description="EPIC documentation templates and smart phrases"
          type="SMARTPHRASE"
          icon="💬"
        />

        <PageTypeSection
          title="Scenarios"
          description="Critical scenarios and emergency protocols"
          type="SCENARIO"
          icon="🚨"
        />

        <PageTypeSection
          title="Wiki Pages"
          description="General knowledge base articles"
          type="WIKI"
          icon="📄"
        />
      </div>
    </div>
  );
}

async function PageTypeSection({
  title,
  description,
  type,
  icon,
}: {
  title: string;
  description: string;
  type: string;
  icon: string;
}) {
  // TODO: Fetch pages by type from database
  // const pages = await prisma.page.findMany({ where: { type, deletedAt: null } });

  return (
    <div className="bg-medium border border-main rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <h2 className="text-2xl font-semibold text-main">{title}</h2>
          <p className="text-sm text-dim">{description}</p>
        </div>
      </div>

      {/* TODO: List pages */}
      <div className="text-dim text-sm">
        <Link
          href={`/pages/new?type=${type}`}
          className="inline-flex items-center gap-2 text-main hover:underline"
        >
          <Plus size={16} />
          Create new {title.toLowerCase()}
        </Link>
      </div>
    </div>
  );
}
