'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, RotateCcw, X as XIcon } from 'lucide-react';
import { clsx } from 'clsx/lite';

interface DeletedPage {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  type: string;
  deletedAt: string;
  viewCount: number;
}

export default function TrashView() {
  const [deletedPages, setDeletedPages] = useState<DeletedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDeletedPages();
  }, []);

  const fetchDeletedPages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pages?includeDeleted=true');

      if (!response.ok) {
        throw new Error('Failed to fetch deleted pages');
      }

      const allPages = await response.json();
      const deleted = allPages.filter((p: any) => p.deletedAt !== null);
      setDeletedPages(deleted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trash');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const response = await fetch(`/api/pages/${id}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to restore page');
      }

      // Remove from deleted pages list
      setDeletedPages((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error restoring page:', err);
      alert('Failed to restore page');
    }
  };

  const handlePermanentDelete = async (id: string, title: string) => {
    if (!confirm(`Permanently delete "${title}"? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/pages/${id}?permanent=true`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete page permanently');
      }

      // Remove from deleted pages list
      setDeletedPages((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Error deleting page:', err);
      alert('Failed to delete page');
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm(`Permanently delete all ${deletedPages.length} pages? This cannot be undone.`)) {
      return;
    }

    try {
      await Promise.all(
        deletedPages.map((page) =>
          fetch(`/api/pages/${page.id}?permanent=true`, {
            method: 'DELETE',
          })
        )
      );

      setDeletedPages([]);
    } catch (err) {
      console.error('Error emptying trash:', err);
      alert('Failed to empty trash');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-dim">Loading trash...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-main mb-2">Trash</h1>
          <p className="text-dim">
            {deletedPages.length} deleted {deletedPages.length === 1 ? 'page' : 'pages'}
          </p>
        </div>

        {deletedPages.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={16} />
            Empty Trash
          </button>
        )}
      </div>

      {/* Empty State */}
      {deletedPages.length === 0 && (
        <div className="text-center py-16">
          <Trash2 size={48} className="mx-auto text-dim mb-4" />
          <h2 className="text-xl font-semibold text-main mb-2">Trash is empty</h2>
          <p className="text-dim">
            Deleted pages will appear here
          </p>
        </div>
      )}

      {/* Deleted Pages List */}
      {deletedPages.length > 0 && (
        <div className="space-y-2">
          {deletedPages.map((page) => (
            <div
              key={page.id}
              className="flex items-center justify-between p-4 border border-main rounded-lg hover:bg-dim transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-2xl flex-shrink-0">
                  {page.icon || '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-main truncate">
                    {page.title}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-dim">
                    <span className="px-2 py-0.5 bg-medium rounded text-xs">
                      {page.type}
                    </span>
                    <span>•</span>
                    <span>
                      Deleted {new Date(page.deletedAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{page.viewCount} views</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleRestore(page.id)}
                  className="flex items-center gap-2 px-3 py-2 border border-main rounded-md hover:bg-medium transition-colors text-sm"
                  title="Restore page"
                >
                  <RotateCcw size={16} />
                  Restore
                </button>
                <button
                  onClick={() => handlePermanentDelete(page.id, page.title)}
                  className="flex items-center gap-2 px-3 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                  title="Delete permanently"
                >
                  <XIcon size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
