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
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Welcome, {session?.user?.name || 'Editor'}
      </h1>
      <p className="text-gray-600 mb-8">
        Manage content across the platform
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map(section => (
          <Link
            key={section.href}
            href={section.href}
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {section.title}
            </h2>
            <p className="text-gray-600">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
