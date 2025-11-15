'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx/lite';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Home,
  FileText,
  Trash2,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import ThemeSwitcher from '@/app/ThemeSwitcher';
import RepoLink from '@/components/RepoLink';
import { NAV_TITLE_OR_DOMAIN } from '@/app/config';
import DraggablePageTree from '@/components/workspace/DraggablePageTree';

export function WorkspaceSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showPages, setShowPages] = useState(true);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  const sidebarContent = (
    <div className="flex flex-col h-full bg-main border-r border-main">
      {/* Mobile Close Button */}
      <div className="lg:hidden flex justify-end p-2 border-b border-main">
        <button
          onClick={() => setIsMobileOpen(false)}
          className="p-1 hover:text-main rounded hover-glow"
        >
          <X size={20} className="text-dim" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-3 space-y-1.5">
        <Link
          href="/"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm border transition-all',
            isActive('/')
              ? 'border-primary text-main font-semibold shadow-soft'
              : 'border-main text-dim hover:text-main hover:border-primary/50 hover-glow'
          )}
        >
          <Home size={18} />
          <span>Home</span>
        </Link>

        <Link
          href="/workspace"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm border transition-all',
            isActive('/workspace')
              ? 'border-primary text-main font-semibold shadow-soft'
              : 'border-main text-dim hover:text-main hover:border-primary/50 hover-glow'
          )}
        >
          <FileText size={18} />
          <span>Workspace</span>
        </Link>

        <Link
          href="/providers"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm border transition-all',
            isActive('/providers')
              ? 'border-primary text-main font-semibold shadow-soft'
              : 'border-main text-dim hover:text-main hover:border-primary/50 hover-glow'
          )}
        >
          <span className="text-lg">👨‍⚕️</span>
          <span>Providers</span>
        </Link>

        <Link
          href="/procedures"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm border transition-all',
            isActive('/procedures')
              ? 'border-primary text-main font-semibold shadow-soft'
              : 'border-main text-dim hover:text-main hover:border-primary/50 hover-glow'
          )}
        >
          <span className="text-lg">📋</span>
          <span>Procedures</span>
        </Link>

        <Link
          href="/smartphrases"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm border transition-all',
            isActive('/smartphrases')
              ? 'border-primary text-main font-semibold shadow-soft'
              : 'border-main text-dim hover:text-main hover:border-primary/50 hover-glow'
          )}
        >
          <span className="text-lg">💬</span>
          <span>Smart Phrases</span>
        </Link>

        <Link
          href="/scenarios"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm border transition-all',
            isActive('/scenarios')
              ? 'border-primary text-main font-semibold shadow-soft'
              : 'border-main text-dim hover:text-main hover:border-primary/50 hover-glow'
          )}
        >
          <span className="text-lg">🚨</span>
          <span>Scenarios</span>
        </Link>

        <Link
          href="/workspace/trash"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm border transition-all',
            isActive('/workspace/trash')
              ? 'border-primary text-main font-semibold shadow-soft'
              : 'border-main text-dim hover:text-main hover:border-primary/50 hover-glow'
          )}
        >
          <Trash2 size={18} />
          <span>Trash</span>
        </Link>
      </div>

      {/* Page Tree Section */}
      <div className="border-t border-main mt-2">
        <button
          onClick={() => setShowPages(!showPages)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-dim hover:text-main transition-colors"
        >
          <span>PAGES</span>
          {showPages ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronRight size={14} />
          )}
        </button>

        {showPages && (
          <div className="max-h-96 overflow-y-auto">
            <DraggablePageTree />
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

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
            <span>Admin</span>
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
