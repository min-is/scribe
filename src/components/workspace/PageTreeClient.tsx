'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronDown, Plus, FileText } from 'lucide-react';
import { clsx } from 'clsx/lite';

interface PageNode {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  type: string;
  children: PageNode[];
  _count: {
    children: number;
  };
}

interface PageTreeClientProps {
  type?: string;
}

export default function PageTreeClient({ type }: PageTreeClientProps) {
  const [pages, setPages] = useState<PageNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetchPages();
  }, [type]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const url = type ? `/api/pages?type=${type}&parentId=null` : '/api/pages?parentId=null';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }

      const data = await response.json();
      setPages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-3 text-sm text-dim">
        Loading pages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 text-sm text-red-500">
        {error}
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="p-3 text-sm text-dim">
        No pages yet
      </div>
    );
  }

  return (
    <div className="py-2">
      {pages.map((page) => (
        <PageTreeNode
          key={page.id}
          page={page}
          level={0}
          currentPath={pathname}
        />
      ))}
    </div>
  );
}

interface PageTreeNodeProps {
  page: PageNode;
  level: number;
  currentPath: string | null;
}

function PageTreeNode({ page, level, currentPath }: PageTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<PageNode[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const hasChildren = page._count.children > 0;
  const isActive = currentPath === `/workspace/pages/${page.slug}`;

  const loadChildren = async () => {
    if (children.length > 0 || isLoadingChildren) return;

    try {
      setIsLoadingChildren(true);
      const response = await fetch(`/api/pages?parentId=${page.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }

      const data = await response.json();
      setChildren(data);
    } catch (err) {
      console.error('Error loading children:', err);
    } finally {
      setIsLoadingChildren(false);
    }
  };

  const handleToggle = async () => {
    if (!isExpanded && hasChildren) {
      await loadChildren();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div>
      <div
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors group',
          isActive
            ? 'bg-dim text-main font-medium'
            : 'text-dim hover:bg-dim hover:text-main'
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-0.5 hover:bg-medium rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        <Link
          href={`/workspace/pages/${page.slug}`}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <span className="text-base flex-shrink-0">
            {page.icon || <FileText size={14} />}
          </span>
          <span className="truncate">{page.title}</span>
        </Link>
      </div>

      {isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <PageTreeNode
              key={child.id}
              page={child}
              level={level + 1}
              currentPath={currentPath}
            />
          ))}
        </div>
      )}

      {isExpanded && isLoadingChildren && (
        <div
          className="text-xs text-dim px-3 py-1"
          style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}
        >
          Loading...
        </div>
      )}
    </div>
  );
}
