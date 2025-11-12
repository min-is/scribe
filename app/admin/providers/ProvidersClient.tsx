'use client';

import { useState } from 'react';
import { Provider } from '@prisma/client';
import { JSONContent } from '@tiptap/core';
import {
  createProvider,
  updateProvider,
  deleteProvider,
  ProviderFormData,
} from '@/provider/actions';
import { WikiContent, createEmptyWikiContent, validateWikiContent, MediaItem } from '@/provider/wiki-schema';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { DifficultyDialInput } from '@/components/DifficultyDialInput';
import { ProviderDifficultyPreview } from '@/components/ProviderDifficultyPreview';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { SectionManager } from '@/components/wiki/SectionManager';
import { UploadDropzone } from '@/components/upload/UploadDropzone';
import { MediaLibrary } from '@/components/upload/MediaLibrary';

type ProvidersClientProps = {
  providers: Provider[];
};

export default function ProvidersClient({
  providers: initialProviders,
}: ProvidersClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for difficulty metrics
  const [generalDifficulty, setGeneralDifficulty] = useState<
    number | undefined
  >(undefined);
  const [speedDifficulty, setSpeedDifficulty] = useState<number | undefined>(
    undefined,
  );
  const [terminologyDifficulty, setTerminologyDifficulty] = useState<
    number | undefined
  >(undefined);
  const [noteDifficulty, setNoteDifficulty] = useState<number | undefined>(
    undefined,
  );

  // Form state for rich text content
  const [noteSmartPhrase, setNoteSmartPhrase] = useState<JSONContent>({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });

  // Form state for wiki content
  const [wikiContent, setWikiContent] = useState<WikiContent>(createEmptyWikiContent());
  const [activeWikiTab, setActiveWikiTab] = useState<'sections' | 'media'>('sections');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    // Update wiki metadata before saving
    const updatedWikiContent: WikiContent = {
      ...wikiContent,
      metadata: {
        ...wikiContent.metadata,
        lastEditedAt: new Date().toISOString(),
        totalEdits: wikiContent.metadata.totalEdits + 1,
      },
    };

    const data: ProviderFormData = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      credentials: formData.get('credentials') as string,
      noteSmartPhrase: JSON.stringify(noteSmartPhrase),
      wikiContent: updatedWikiContent as any,
      generalDifficulty,
      speedDifficulty,
      terminologyDifficulty,
      noteDifficulty,
    };

    try {
      const result = editingProvider
        ? await updateProvider(editingProvider.id, data)
        : await createProvider(data);

      if (result.success) {
        toast.success(
          editingProvider
            ? 'Provider updated successfully'
            : 'Provider created successfully',
        );
        setShowForm(false);
        setEditingProvider(null);
        resetDifficultyFields();
        resetRichTextFields();
        router.refresh();
      } else {
        toast.error(result.error || 'An error occurred');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    const result = await deleteProvider(id);

    if (result.success) {
      toast.success('Provider deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete provider');
    }
  };

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider);
    setGeneralDifficulty(provider.generalDifficulty ?? undefined);
    setSpeedDifficulty(provider.speedDifficulty ?? undefined);
    setTerminologyDifficulty(provider.terminologyDifficulty ?? undefined);
    setNoteDifficulty(provider.noteDifficulty ?? undefined);

    // Load note smartphrase content
    if (provider.noteSmartPhrase) {
      try {
        const parsed = JSON.parse(provider.noteSmartPhrase);
        setNoteSmartPhrase(parsed);
      } catch {
        // If not JSON, convert plain text to JSONContent
        setNoteSmartPhrase({
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: provider.noteSmartPhrase }] }],
        });
      }
    } else {
      setNoteSmartPhrase({ type: 'doc', content: [{ type: 'paragraph' }] });
    }

    // Load wiki content
    if (provider.wikiContent && validateWikiContent(provider.wikiContent)) {
      setWikiContent(provider.wikiContent as WikiContent);
    } else {
      setWikiContent(createEmptyWikiContent());
    }

    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProvider(null);
    resetDifficultyFields();
    resetRichTextFields();
  };

  const resetDifficultyFields = () => {
    setGeneralDifficulty(undefined);
    setSpeedDifficulty(undefined);
    setTerminologyDifficulty(undefined);
    setNoteDifficulty(undefined);
  };

  const resetRichTextFields = () => {
    setNoteSmartPhrase({ type: 'doc', content: [{ type: 'paragraph' }] });
    setWikiContent(createEmptyWikiContent());
    setActiveWikiTab('sections');
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
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-main">Manage Providers</h1>
            <p className="text-dim mt-1">
              Add and manage provider profiles and preferences
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Provider
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-medium border border-main rounded-lg p-6">
            <h2 className="text-xl font-semibold text-main mb-4">
              {editingProvider ? 'Edit Provider' : 'Add New Provider'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-main mb-1"
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    defaultValue={editingProvider?.name || ''}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dr. John Smith"
                  />
                </div>

                <div>
                  <label
                    htmlFor="slug"
                    className="block text-sm font-medium text-main mb-1"
                  >
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    required
                    defaultValue={editingProvider?.slug || ''}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="provider-smith"
                    pattern="[a-z0-9\-]+"
                    title="Only lowercase letters, numbers, and hyphens"
                  />
                  <p className="text-xs text-dim mt-1">
                    Used in URL: #provider-smith
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="credentials"
                  className="block text-sm font-medium text-main mb-1"
                >
                  Credentials
                </label>
                <input
                  type="text"
                  id="credentials"
                  name="credentials"
                  defaultValue={editingProvider?.credentials || ''}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="MD, FACEM"
                />
              </div>

              {/* Difficulty Metrics */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h3 className="text-lg font-medium text-main mb-4">
                  Difficulty Metrics (1-10 scale)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DifficultyDialInput
                    label="General Difficulty"
                    value={generalDifficulty}
                    onChange={setGeneralDifficulty}
                    helperText="Overall difficulty level for new scribes"
                  />

                  <DifficultyDialInput
                    label="Speed Expectations"
                    value={speedDifficulty}
                    onChange={setSpeedDifficulty}
                    helperText="How fast this provider works"
                  />

                  <DifficultyDialInput
                    label="Terminology Level"
                    value={terminologyDifficulty}
                    onChange={setTerminologyDifficulty}
                    helperText="Medical terminology expectations"
                  />

                  <DifficultyDialInput
                    label="Note Complexity"
                    value={noteDifficulty}
                    onChange={setNoteDifficulty}
                    helperText="Complexity of note requirements"
                  />
                </div>
              </div>

              {/* Note SmartPhrase */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <label
                  htmlFor="noteSmartPhrase"
                  className="block text-sm font-medium text-main mb-1"
                >
                  Note SmartPhrase
                </label>
                <RichTextEditor
                  content={noteSmartPhrase}
                  onChange={setNoteSmartPhrase}
                  placeholder="Add SmartPhrases and custom notes from general template..."
                />
                <p className="text-xs text-dim mt-1">
                  Custom notes and SmartPhrases specific to this provider
                </p>
              </div>

              {/* Provider Documentation - Wiki System */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <h3 className="text-lg font-medium text-main mb-4">
                  Provider Documentation (Wiki)
                </h3>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveWikiTab('sections')}
                      className={`px-4 py-2 border-b-2 transition-colors ${
                        activeWikiTab === 'sections'
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-medium'
                          : 'border-transparent text-dim hover:text-main'
                      }`}
                    >
                      📝 Sections ({wikiContent.sections.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveWikiTab('media')}
                      className={`px-4 py-2 border-b-2 transition-colors ${
                        activeWikiTab === 'media'
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-medium'
                          : 'border-transparent text-dim hover:text-main'
                      }`}
                    >
                      🖼️ Media ({wikiContent.media.length})
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                {activeWikiTab === 'sections' && (
                  <div>
                    <div className="text-sm text-dim mb-4">
                      Create sections to organize clinical information, preferences, and documentation. Drag to reorder.
                    </div>
                    <SectionManager
                      sections={wikiContent.sections}
                      onChange={(sections) =>
                        setWikiContent({ ...wikiContent, sections })
                      }
                    />
                  </div>
                )}

                {activeWikiTab === 'media' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-semibold text-main mb-2">
                        Upload Media
                      </h4>
                      <p className="text-sm text-dim mb-4">
                        Upload images, videos, or documents to use in wiki sections
                      </p>
                      <UploadDropzone
                        onUploadComplete={handleUploadComplete}
                        onUploadError={(err) => toast.error(err)}
                      />
                    </div>

                    <div>
                      <h4 className="text-md font-semibold text-main mb-4">
                        Media Library ({wikiContent.media.length})
                      </h4>
                      <MediaLibrary
                        media={wikiContent.media}
                        onDelete={handleDeleteMedia}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingProvider
                      ? 'Update Provider'
                      : 'Create Provider'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-medium border border-main rounded-lg overflow-hidden">
          {initialProviders.length === 0 ? (
            <div className="p-8 text-center text-dim">
              <p>No providers added yet.</p>
              <p className="text-sm mt-1">
                Click &quot;Add Provider&quot; to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-main">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                      Credentials
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-dim uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                      URL Slug
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-dim uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {initialProviders.map((provider) => (
                    <tr
                      key={provider.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-main">
                        {provider.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dim">
                        {provider.credentials || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex justify-center">
                          <ProviderDifficultyPreview
                            generalDifficulty={provider.generalDifficulty}
                            size="small"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-dim">
                        #{provider.slug}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleEdit(provider)}
                          className="font-admin mr-4 px-3 py-1.5 rounded-md transition-all duration-300 text-blue-600 dark:text-blue-400"
                          style={{
                            boxShadow: '0 0 10px rgba(59, 130, 246, 0.2)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.4), 0 0 25px rgba(59, 130, 246, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.2)';
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(provider.id, provider.name)
                          }
                          className="font-admin px-3 py-1.5 rounded-md transition-all duration-300 text-red-600 dark:text-red-400"
                          style={{
                            boxShadow: '0 0 10px rgba(239, 68, 68, 0.2)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.4), 0 0 25px rgba(239, 68, 68, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.2)';
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
