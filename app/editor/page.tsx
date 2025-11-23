import { Metadata } from 'next/types';
import { auth } from '@/auth/server';

export const metadata: Metadata = {
  title: 'Editor Dashboard',
};

export default async function EditorPage() {
  const session = await auth();

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Editor Dashboard
          </h1>
          <p className="text-zinc-400 text-base">
            Welcome, {session?.user?.email}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a
            href="/editor/providers"
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-150 block"
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
              Providers
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              View and edit provider profiles
            </p>
          </a>

          <a
            href="/editor/smartphrases"
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-150 block"
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
              SmartPhrases
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Edit EPIC SmartPhrases (.phrases)
            </p>
          </a>

          <a
            href="/editor/scenarios"
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-150 block"
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
              Scenarios
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Edit clinical scenario walkthroughs
            </p>
          </a>

          <a
            href="/editor/procedures"
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-150 block"
          >
            <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
              Procedures
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Edit medical procedure guides
            </p>
          </a>
        </div>

        <div className="bg-blue-950/30 border border-blue-900/30 rounded-xl p-6">
          <h3 className="text-base font-semibold text-blue-400 mb-2">
            Editor Permissions
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            As an editor, you can view and modify content but cannot delete resources or access system configuration.
          </p>
        </div>
      </div>
    </div>
  );
}
