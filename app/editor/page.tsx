import { auth } from '@/auth/server';
import Link from 'next/link';
import {
  PATH_EDITOR_PROVIDERS,
  PATH_EDITOR_SMARTPHRASES,
  PATH_EDITOR_SCENARIOS,
  PATH_EDITOR_PROCEDURES,
} from '@/app/paths';

export default async function EditorDashboard() {
  const session = await auth();

  const sections = [
    {
      title: 'Providers',
      description: 'Manage healthcare providers',
      href: PATH_EDITOR_PROVIDERS,
    },
    {
      title: 'SmartPhrases',
      description: 'Edit SmartPhrase library',
      href: PATH_EDITOR_SMARTPHRASES,
    },
    {
      title: 'Scenarios',
      description: 'Manage clinical scenarios',
      href: PATH_EDITOR_SCENARIOS,
    },
    {
      title: 'Procedures',
      description: 'Edit medical procedures',
      href: PATH_EDITOR_PROCEDURES,
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
            Welcome, {session?.user?.name || 'Editor'}
          </h1>
          <p className="text-zinc-400 text-base">
            Manage content across the platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map(section => (
            <Link
              key={section.href}
              href={section.href}
              className="group bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-150 block"
            >
              <h2 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-white transition-colors">
                {section.title}
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {section.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
