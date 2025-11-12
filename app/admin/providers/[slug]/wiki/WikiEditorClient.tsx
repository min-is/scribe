'use client';

import { useState } from 'react';
import { Provider } from '@prisma/client';
import { WikiContent, createEmptyWikiContent, validateWikiContent, MediaItem } from '@/provider/wiki-schema';
import { SectionManager } from '@/components/wiki/SectionManager';
import { UploadDropzone } from '@/components/upload/UploadDropzone';
import { MediaLibrary } from '@/components/upload/MediaLibrary';
import { WikiContentRenderer } from '@/components/wiki/WikiContentRenderer';
import { updateProvider } from '@/provider/actions';
import { useRouter } from 'next/navigation';

interface WikiEditorClientProps {
  provider: Provider;
}

export function WikiEditorClient({ provider }: WikiEditorClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'media'>('edit');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Initialize wiki content
  const [wikiContent, setWikiContent] = useState<WikiContent>(() => {
    if (provider.wikiContent && validateWikiContent(provider.wikiContent)) {
      return provider.wikiContent as WikiContent;
    }
    return createEmptyWikiContent();
  });

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Update metadata
      const updatedWikiContent: WikiContent = {
        ...wikiContent,
        metadata: {
          ...wikiContent.metadata,
          lastEditedAt: new Date().toISOString(),
          totalEdits: wikiContent.metadata.totalEdits + 1,
        },
      };

      await updateProvider(provider.id, {
        wikiContent: updatedWikiContent as any,
      });

      setWikiContent(updatedWikiContent);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadComplete = (media: MediaItem) => {
    setWikiContent({
      ...wikiContent,
      media: [...wikiContent.media, media],
    });
  };

  const handleDeleteMedia = (mediaId: string) => {
    setWikiContent({
      ...wikiContent,
      media: wikiContent.media.filter((m) => m.id !== mediaId),
    });
  };

  return (
    <div className="min-h-screen p-8 bg-main">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/admin/providers')}
              className="text-sm text-dim hover:text-main mb-2 flex items-center gap-1"
            >
              ← Back to Providers
            </button>
            <h1 className="text-3xl font-bold text-main">
              Edit Wiki: {provider.name}
            </h1>
            <p className="text-dim mt-1">
              {provider.credentials && `${provider.credentials} • `}
              Create rich, wiki-style documentation
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-green-800 dark:text-green-200">
            Changes saved successfully!
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'edit'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-medium'
                  : 'border-transparent text-dim hover:text-main'
              }`}
            >
              ✏️ Edit Sections
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'preview'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-medium'
                  : 'border-transparent text-dim hover:text-main'
              }`}
            >
              👁️ Preview
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'media'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-medium'
                  : 'border-transparent text-dim hover:text-main'
              }`}
            >
              🖼️ Media ({wikiContent.media.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-medium border border-main rounded-lg p-6">
          {activeTab === 'edit' && (
            <div className="space-y-4">
              <div className="text-sm text-dim mb-4">
                Create sections to organize provider information. Drag to reorder, click to edit.
              </div>
              <SectionManager
                sections={wikiContent.sections}
                onChange={(sections) =>
                  setWikiContent({ ...wikiContent, sections })
                }
              />
            </div>
          )}

          {activeTab === 'preview' && (
            <div>
              <WikiContentRenderer wikiContent={wikiContent} showTOC={true} />
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-main mb-2">
                  Upload Media
                </h3>
                <p className="text-sm text-dim mb-4">
                  Upload images, videos, or documents to use in your wiki content
                </p>
                <UploadDropzone
                  onUploadComplete={handleUploadComplete}
                  onUploadError={(err) => setError(err)}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-main mb-4">
                  Media Library ({wikiContent.media.length})
                </h3>
                <MediaLibrary
                  media={wikiContent.media}
                  onDelete={handleDeleteMedia}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-medium border border-main rounded-lg p-4">
            <div className="text-2xl font-bold text-main">
              {wikiContent.sections.length}
            </div>
            <div className="text-sm text-dim">Sections</div>
          </div>
          <div className="bg-medium border border-main rounded-lg p-4">
            <div className="text-2xl font-bold text-main">
              {wikiContent.media.length}
            </div>
            <div className="text-sm text-dim">Media Files</div>
          </div>
          <div className="bg-medium border border-main rounded-lg p-4">
            <div className="text-2xl font-bold text-main">
              {wikiContent.metadata.totalEdits}
            </div>
            <div className="text-sm text-dim">Total Edits</div>
          </div>
        </div>
      </div>
    </div>
  );
}
