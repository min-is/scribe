import { Metadata } from 'next/types';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

export default function AdminPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-zinc-400 text-base">
            Manage scribe resources and configuration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a
            href="/admin/providers"
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-150 block"
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
              Providers
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Manage provider profiles and preferences
            </p>
          </a>

          <a
            href="/admin/smartphrases"
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-150 block"
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
              SmartPhrases
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Manage EPIC SmartPhrases (.phrases)
            </p>
          </a>

          <a
            href="/admin/scenarios"
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-150 block"
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
              Scenarios
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Manage clinical scenario walkthroughs
            </p>
          </a>

          <a
            href="/admin/procedures"
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-150 block"
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
              Procedures
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Manage medical procedure guides
            </p>
          </a>

          <a
            href="/admin/physicians"
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-150 block"
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
              Physician Directory
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Manage hospital physician directory
            </p>
          </a>

          <a
            href="/admin/medications"
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-150 block"
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
              Medications
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Manage medication reference library
            </p>
          </a>

          <a
            href="/admin/animated-messages"
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-150 block"
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
              Home Page Content
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Edit announcements and getting started content
            </p>
          </a>

          <a
            href="/admin/database"
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-150 block"
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
              Database
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Run migrations and manage database
            </p>
          </a>

          <a
            href="/admin/diagnostics"
            className="group bg-amber-950/30 border border-amber-900/30 rounded-xl p-6 hover:bg-amber-950/50 hover:border-amber-800/40 transition-all duration-150 block"
          >
            <h2 className="text-lg font-semibold text-amber-400 mb-2 group-hover:text-amber-300 transition-colors">
              System Diagnostics
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Check database connectivity and table status
            </p>
          </a>

          <a
            href="/admin/configuration"
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-150 block"
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
              Configuration
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              View application configuration
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
