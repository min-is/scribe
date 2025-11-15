'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx/lite';
import {
  ChevronRight,
  Edit,
  MoreHorizontal,
  Trash2,
  Copy,
  Share2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PageViewerProps {
  page: any; // TODO: Type this properly
}

export function PageViewer({ page }: PageViewerProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  // Render TipTap content (simplified version)
  const renderContent = (content: any) => {
    if (!content || !content.content) {
      return <p className="text-dim">No content yet. Click Edit to add content.</p>;
    }

    // Simple rendering - would be replaced with actual TipTap renderer
    return (
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {content.content.map((node: any, i: number) => {
          if (node.type === 'paragraph') {
            return (
              <p key={i}>
                {node.content?.map((textNode: any) => textNode.text).join('')}
              </p>
            );
          }
          if (node.type === 'heading') {
            const level = node.attrs.level;
            const text = node.content?.map((textNode: any) => textNode.text).join('');

            switch (level) {
              case 1: return <h1 key={i}>{text}</h1>;
              case 2: return <h2 key={i}>{text}</h2>;
              case 3: return <h3 key={i}>{text}</h3>;
              case 4: return <h4 key={i}>{text}</h4>;
              case 5: return <h5 key={i}>{text}</h5>;
              case 6: return <h6 key={i}>{text}</h6>;
              default: return <p key={i}>{text}</p>;
            }
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-8 py-12">
      {/* Breadcrumbs */}
      {page.parent && (
        <nav className="flex items-center gap-2 text-sm text-dim mb-6">
          <Link href="/pages" className="hover:text-main transition-colors">
            All Pages
          </Link>
          <ChevronRight size={14} />
          <Link
            href={`/pages/${page.parent.slug}`}
            className="hover:text-main transition-colors flex items-center gap-1"
          >
            <span>{page.parent.icon}</span>
            <span>{page.parent.title}</span>
          </Link>
          <ChevronRight size={14} />
          <span className="text-main">{page.title}</span>
        </nav>
      )}

      {/* Cover Photo */}
      {page.coverPhoto && (
        <div className="mb-8 -mx-8">
          <img
            src={page.coverPhoto}
            alt=""
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {page.icon && <div className="text-6xl mb-4">{page.icon}</div>}
            <h1 className="text-5xl font-bold text-main mb-2">{page.title}</h1>
            {page.category && (
              <div className="inline-flex items-center px-3 py-1 bg-medium border border-main rounded-full text-sm text-dim">
                {page.category}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 hover:bg-medium rounded transition-colors"
              title="Edit"
            >
              <Edit size={18} className="text-dim" />
            </button>
            <button
              className="p-2 hover:bg-medium rounded transition-colors"
              title="More"
            >
              <MoreHorizontal size={18} className="text-dim" />
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-dim">
          <span>
            Last edited{' '}
            {formatDistanceToNow(new Date(page.updatedAt), { addSuffix: true })}
          </span>
          <span>•</span>
          <span>{page.viewCount} views</span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-12">{renderContent(page.content)}</div>

      {/* Child Pages */}
      {page.children && page.children.length > 0 && (
        <div className="border-t border-main pt-8">
          <h2 className="text-xl font-semibold text-main mb-4">Subpages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {page.children.map((child: any) => (
              <Link
                key={child.id}
                href={`/pages/${child.slug}`}
                className="flex items-center gap-3 p-4 bg-medium border border-main rounded-lg hover:border-dim transition-colors"
              >
                <span className="text-2xl">{child.icon || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-main truncate">{child.title}</div>
                  <div className="text-xs text-dim">{child.type}</div>
                </div>
                <ChevronRight size={16} className="text-dim flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
