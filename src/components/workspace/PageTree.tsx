'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx/lite';
import {
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  Plus,
  MoreHorizontal,
} from 'lucide-react';

interface PageNode {
  id: string;
  slug: string;
  title: string;
  icon?: string | null;
  type: string;
  children: PageNode[];
}

export function PageTree() {
  const [pages, setPages] = useState<PageNode[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Fetch page tree from API
    fetch('/api/pages/tree')
      .then((res) => res.json())
      .then((data) => {
        setPages(data.pages || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load page tree:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 bg-dim animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="text-center py-8 text-dim text-sm">
        <p>No pages yet</p>
        <Link
          href="/pages/new"
          className="mt-2 inline-flex items-center gap-1 text-xs text-main hover:underline"
        >
          <Plus size={14} />
          Create your first page
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {pages.map((page) => (
        <PageTreeNode key={page.id} page={page} level={0} />
      ))}
    </div>
  );
}

function PageTreeNode({ page, level }: { page: PageNode; level: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const hasChildren = page.children && page.children.length > 0;
  const isActive = pathname === `/pages/${page.slug}`;

  const paddingLeft = level * 16;

  return (
    <div>
      <div
        className={clsx(
          'group flex items-center gap-1 px-2 py-1.5 rounded-md text-sm transition-colors relative',
          isActive
            ? 'bg-dim text-main font-medium'
            : 'text-dim hover:bg-dim hover:text-main'
        )}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="flex-shrink-0 p-0.5 hover:bg-medium rounded"
          >
            {isOpen ? (
              <ChevronDown size={14} className="text-dim" />
            ) : (
              <ChevronRight size={14} className="text-dim" />
            )}
          </button>
        )}

        {/* Icon */}
        <span className="flex-shrink-0 text-base">
          {page.icon || (page.type === 'FOLDER' ? '📁' : '📄')}
        </span>

        {/* Title */}
        <Link
          href={`/pages/${page.slug}`}
          className="flex-1 truncate min-w-0"
        >
          {page.title}
        </Link>

        {/* Actions (show on hover) */}
        {isHovered && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Show page actions menu
            }}
            className="flex-shrink-0 p-0.5 hover:bg-medium rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal size={14} className="text-dim" />
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && isOpen && (
        <div className="mt-1">
          {page.children.map((child) => (
            <PageTreeNode key={child.id} page={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
