import { Metadata } from 'next/types';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

export default function AdminPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-main mb-2">
            Admin Dashboard
          </h1>
          <p className="text-dim">
            Manage scribe resources and configuration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="/admin/providers"
            className="bg-medium border border-main rounded-lg p-6 hover:bg-dim transition-colors"
          >
            <h2 className="text-xl font-semibold text-main mb-2">
              Providers
            </h2>
            <p className="text-dim">
              Manage provider profiles and preferences
            </p>
          </a>

          <a
            href="/admin/smartphrases"
            className="bg-medium border border-main rounded-lg p-6 hover:bg-dim transition-colors"
          >
            <h2 className="text-xl font-semibold text-main mb-2">
              SmartPhrases
            </h2>
            <p className="text-dim">
              Manage EPIC SmartPhrases (.phrases)
            </p>
          </a>

          <a
            href="/admin/scenarios"
            className="bg-medium border border-main rounded-lg p-6 hover:bg-dim transition-colors"
          >
            <h2 className="text-xl font-semibold text-main mb-2">
              Scenarios
            </h2>
            <p className="text-dim">
              Manage clinical scenario walkthroughs
            </p>
          </a>

          <a
            href="/admin/procedures"
            className="bg-medium border border-main rounded-lg p-6 hover:bg-dim transition-colors"
          >
            <h2 className="text-xl font-semibold text-main mb-2">
              Procedures
            </h2>
            <p className="text-dim">
              Manage medical procedure guides
            </p>
          </a>

          <a
            href="/admin/database"
            className="bg-medium border border-main rounded-lg p-6 hover:bg-dim transition-colors"
          >
            <h2 className="text-xl font-semibold text-main mb-2">
              Database
            </h2>
            <p className="text-dim">
              Run migrations and manage database
            </p>
          </a>

          <a
            href="/admin/diagnostics"
            className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 hover:bg-yellow-500/20 transition-colors"
          >
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">
              🔍 System Diagnostics
            </h2>
            <p className="text-dim">
              Check database connectivity and table status
            </p>
          </a>

          <a
            href="/admin/tags"
            className="bg-medium border border-main rounded-lg p-6 hover:bg-dim transition-colors"
          >
            <h2 className="text-xl font-semibold text-main mb-2">
              Tags
            </h2>
            <p className="text-dim">
              Manage tags for organizing resources
            </p>
          </a>

          <a
            href="/admin/configuration"
            className="bg-medium border border-main rounded-lg p-6 hover:bg-dim transition-colors"
          >
            <h2 className="text-xl font-semibold text-main mb-2">
              Configuration
            </h2>
            <p className="text-dim">
              View application configuration
            </p>
          </a>

          <a
            href="/admin/insights"
            className="bg-medium border border-main rounded-lg p-6 hover:bg-dim transition-colors"
          >
            <h2 className="text-xl font-semibold text-main mb-2">
              Insights
            </h2>
            <p className="text-dim">
              View analytics and insights
            </p>
          </a>

          <a
            href="/admin/components"
            className="bg-medium border border-main rounded-lg p-6 hover:bg-dim transition-colors"
          >
            <h2 className="text-xl font-semibold text-main mb-2">
              Components
            </h2>
            <p className="text-dim">
              Component showcase and reference
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
