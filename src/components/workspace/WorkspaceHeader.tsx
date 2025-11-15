'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx/lite';
import { Search, Bell, User } from 'lucide-react';
import { useAppState } from '@/state/AppState';

export function WorkspaceHeader() {
  const pathname = usePathname();
  const { userEmail } = useAppState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="h-14 border-b border-main bg-main px-6 flex items-center justify-between">
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <button
          onClick={() => {
            // Trigger Cmd+K modal (already exists in your app)
            const event = new KeyboardEvent('keydown', {
              key: 'k',
              metaKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          }}
          className="w-full flex items-center gap-2 px-3 py-1.5 bg-medium border border-main rounded-md text-sm text-dim hover:border-dim transition-colors"
        >
          <Search size={16} />
          <span>Search...</span>
          <kbd className="ml-auto text-xs bg-dim px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-3">
        {mounted && userEmail && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-medium rounded-md">
            <User size={16} className="text-dim" />
            <span className="text-sm text-main hidden sm:block">{userEmail}</span>
          </div>
        )}
      </div>
    </header>
  );
}
