'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  PATH_EDITOR,
  PATH_EDITOR_PROVIDERS,
  PATH_EDITOR_SMARTPHRASES,
  PATH_EDITOR_SCENARIOS,
  PATH_EDITOR_PROCEDURES,
  PATH_EDITOR_MEDICATIONS,
  PATH_EDITOR_TERMINOLOGY,
} from '@/app/paths';
import { clsx } from 'clsx/lite';

export default function EditorNav() {
  const pathname = usePathname();

  const navItems = [
    { href: PATH_EDITOR, label: 'Dashboard' },
    { href: PATH_EDITOR_PROVIDERS, label: 'Providers' },
    { href: PATH_EDITOR_SMARTPHRASES, label: 'SmartPhrases' },
    { href: PATH_EDITOR_SCENARIOS, label: 'Scenarios' },
    { href: PATH_EDITOR_PROCEDURES, label: 'Procedures' },
    { href: PATH_EDITOR_MEDICATIONS, label: 'Medications' },
    { href: PATH_EDITOR_TERMINOLOGY, label: 'Terminology' },
  ];

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-8">
            <div className="flex items-center">
              <span className="text-xl font-semibold">
                Editor Panel
              </span>
            </div>
            <div className="flex space-x-4">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md',
                    pathname === item.href
                      ? 'font-bold'
                      : 'text-dim hover:text-main'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="text-sm text-dim hover:text-main"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
