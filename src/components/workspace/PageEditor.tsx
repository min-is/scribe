'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TipTapEditor from '@/components/editor/TipTapEditor';
import { Save, X, Trash2, Eye, Settings as SettingsIcon } from 'lucide-react';
import { clsx } from 'clsx/lite';
import Link from 'next/link';

interface PageEditorProps {
  page: {
    id: string;
    slug: string;
    title: string;
    content: any;
    icon: string | null;
    coverPhoto: string | null;
    type: string;
    parentId: string | null;
  };
}

export default function PageEditor({ page }: PageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [icon, setIcon] = useState(page.icon || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Auto-save on changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title !== page.title || JSON.stringify(content) !== JSON.stringify(page.content)) {
        handleSave();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, content]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          icon: icon || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      setLastSaved(new Date());
      router.refresh();
    } catch (error) {
      console.error('Error saving page:', error);
      alert('Failed to save page');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/pages/${page.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      router.push('/home');
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete page');
    }
  };

  return (
    <div className="h-full flex flex-col bg-main">
      {/* Editor Header */}
      <div className="border-b border-main bg-medium sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href={`/home/pages/${page.slug}`}
              className="p-2 hover:bg-dim rounded-md transition-colors"
              title="Close editor"
            >
              <X size={20} className="text-dim" />
            </Link>
            <div className="flex items-center gap-2 text-sm text-dim">
              {isSaving && (
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  Saving...
                </span>
              )}
              {!isSaving && lastSaved && (
                <span>
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/home/pages/${page.slug}`}
              className="flex items-center gap-2 px-4 py-2 border border-main rounded-md hover:bg-dim transition-colors text-sm"
            >
              <Eye size={16} />
              Preview
            </Link>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 border border-main rounded-md transition-colors text-sm',
                showSettings ? 'bg-dim' : 'hover:bg-dim'
              )}
            >
              <SettingsIcon size={16} />
              Settings
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
            >
              <Trash2 size={16} />
              Delete
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded-md hover:opacity-90 transition-opacity text-sm disabled:opacity-50"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t border-main px-6 py-4 bg-dim">
            <div className="max-w-2xl space-y-4">
              <div>
                <label className="block text-xs font-medium text-dim mb-2">
                  ICON (EMOJI)
                </label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="📄"
                  className="w-20 px-3 py-2 border border-main rounded-md bg-main text-main text-2xl text-center"
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-dim mb-2">
                  PAGE TYPE
                </label>
                <div className="px-3 py-2 border border-main rounded-md bg-medium text-main text-sm">
                  {page.type}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-6">
          {/* Icon and Title */}
          <div className="mb-6">
            {icon && (
              <div className="text-6xl mb-4">
                {icon}
              </div>
            )}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-4xl font-bold border-none outline-none bg-transparent text-main placeholder-dim"
              placeholder="Untitled"
            />
          </div>

          {/* TipTap Editor */}
          <TipTapEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing..."
            editable={true}
          />
        </div>
      </div>
    </div>
  );
}
