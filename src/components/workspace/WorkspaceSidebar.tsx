'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx/lite';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Home,
  FileText,
  Trash2,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { PageTree } from './PageTree';
import ThemeSwitcher from '@/app/ThemeSwitcher';
import RepoLink from '@/components/RepoLink';
import { NAV_TITLE_OR_DOMAIN } from '@/app/config';

export function WorkspaceSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  const sidebarContent = (
    <div className="flex flex-col h-full bg-medium border-r border-main">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-main">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-main hover:text-dim transition-colors"
        >
          <span>{NAV_TITLE_OR_DOMAIN}</span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1 hover:bg-dim rounded"
        >
          <X size={20} className="text-dim" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-3 space-y-1">
        <Link
          href="/home"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
            isActive('/home')
              ? 'bg-dim text-main font-medium'
              : 'text-dim hover:bg-dim hover:text-main'
          )}
        >
          <Home size={18} />
          <span>Home</span>
        </Link>

        <Link
          href="/home/trash"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
            isActive('/home/trash')
              ? 'bg-dim text-main font-medium'
              : 'text-dim hover:bg-dim hover:text-main'
          )}
        >
          <Trash2 size={18} />
          <span>Trash</span>
        </Link>
      </div>

      {/* Page Tree */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold text-dim uppercase tracking-wider">
            Pages
          </span>
          <Link
            href="/home/pages/new"
            className="p-1 hover:bg-dim rounded transition-colors"
            title="New Page"
          >
            <Plus size={16} className="text-dim" />
          </Link>
        </div>
        <PageTree />
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-main space-y-3">
        <div className="flex items-center justify-between text-xs text-dim">
          <RepoLink />
        </div>
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="text-xs text-dim hover:text-main transition-colors flex items-center gap-1"
          >
            <Settings size={14} />
            <span>Settings</span>
          </Link>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-medium border border-main rounded-md shadow-lg"
      >
        <Menu size={20} className="text-main" />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={clsx(
          'hidden lg:block transition-all duration-300',
          isOpen ? 'w-64' : 'w-0'
        )}
      >
        {isOpen && sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={clsx(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 transform',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
