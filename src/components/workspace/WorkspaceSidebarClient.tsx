'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx/lite';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Menu,
  X,
} from 'lucide-react';
import DraggablePageTree from '@/components/workspace/DraggablePageTree';

export function WorkspaceSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showPages, setShowPages] = useState(true);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname?.startsWith(path + '/');

  const sidebarContent = (
    <div className="flex flex-col h-full bg-main">
      {/* Mobile Close Button */}
      <div className="lg:hidden flex justify-end p-2 border-b border-main">
        <button
          onClick={() => setIsMobileOpen(false)}
          className="p-1 hover:text-main rounded hover-glow"
        >
          <X size={20} className="text-dim" />
        </button>
      </div>

      {/* Navigation */}
      <div className="p-3 space-y-1">
        <Link
          href="/workspace"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 text-sm transition-all border-b-2',
            isActive('/workspace')
              ? 'border-primary text-main font-semibold'
              : 'border-transparent text-dim hover:text-main hover:border-primary/30 hover-glow'
          )}
        >
          <FileText size={18} />
          <span>Workspace</span>
        </Link>

        <Link
          href="/providers"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 text-sm transition-all border-b-2',
            isActive('/providers')
              ? 'border-primary text-main font-semibold'
              : 'border-transparent text-dim hover:text-main hover:border-primary/30 hover-glow'
          )}
        >
          <span>Providers</span>
        </Link>

        <Link
          href="/procedures"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 text-sm transition-all border-b-2',
            isActive('/procedures')
              ? 'border-primary text-main font-semibold'
              : 'border-transparent text-dim hover:text-main hover:border-primary/30 hover-glow'
          )}
        >
          <span>Procedures</span>
        </Link>

        <Link
          href="/smartphrases"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 text-sm transition-all border-b-2',
            isActive('/smartphrases')
              ? 'border-primary text-main font-semibold'
              : 'border-transparent text-dim hover:text-main hover:border-primary/30 hover-glow'
          )}
        >
          <span>Smart Phrases</span>
        </Link>

        <Link
          href="/scenarios"
          className={clsx(
            'flex items-center gap-3 px-3 py-2 text-sm transition-all border-b-2',
            isActive('/scenarios')
              ? 'border-primary text-main font-semibold'
              : 'border-transparent text-dim hover:text-main hover:border-primary/30 hover-glow'
          )}
        >
          <span>Scenarios</span>
        </Link>
      </div>

      {/* Page Tree Section */}
      <div className="mt-4">
        <button
          onClick={() => setShowPages(!showPages)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-dim hover:text-main transition-all border-b-2 border-transparent hover:border-primary/30 hover-glow"
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
