'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FiEdit, FiTrash2, FiPlus, FiFolder, FiFile, FiX } from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { ResourceSection, ResourceArticle } from '@/resource/types';
import {
  createResourceArticle,
  updateResourceArticle,
  deleteResourceArticle,
} from '@/resource/actions';

// Dynamically import TipTapEditor to avoid SSR issues
const TipTapEditor = dynamic(() => import('@/components/editor/TipTapEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
  ),
});

type ResourcesEditorClientProps = {
  sections: ResourceSection[];
};

type EditMode =
  | { type: 'none' }
  | { type: 'article'; sectionId: string; article?: ResourceArticle };

export default function ResourcesEditorClient({
  sections: initialSections,
}: ResourcesEditorClientProps) {
  const router = useRouter();
  const [editMode, setEditMode] = useState<EditMode>({ type: 'none' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Article editor state
  const [articleTitle, setArticleTitle] = useState('');
  const [articleSlug, setArticleSlug] = useState('');
  const [articleIcon, setArticleIcon] = useState('📄');
  const [articleContent, setArticleContent] = useState<any>({
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });

  const handleCreateArticle = (sectionId: string) => {
    setArticleTitle('');
    setArticleSlug('');
    setArticleIcon('📄');
    setArticleContent({
      type: 'doc',
      content: [{ type: 'paragraph' }],
    });
    setEditMode({ type: 'article', sectionId });
  };

  const handleEditArticle = (sectionId: string, article: ResourceArticle) => {
    setArticleTitle(article.title);
    setArticleSlug(article.slug);
    setArticleIcon(article.icon || '📄');
    setArticleContent(article.content);
    setEditMode({ type: 'article', sectionId, article });
  };

  const handleDeleteArticle = async (article: ResourceArticle) => {
    if (!confirm(`Are you sure you want to delete "${article.title}"?`)) return;

    const result = await deleteResourceArticle(article.id);

    if (result.success) {
      toast.success('Article deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete article');
    }
  };

  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editMode.type !== 'article') return;

      const data = {
        title: articleTitle,
        slug: articleSlug,
        content: articleContent,
        icon: articleIcon,
        sectionId: editMode.sectionId,
      };

      const result = editMode.article
        ? await updateResourceArticle(editMode.article.id, data)
        : await createResourceArticle(data);

      if (result.success) {
        toast.success(
          editMode.article
            ? 'Article updated successfully'
            : 'Article created successfully'
        );
        setEditMode({ type: 'none' });
        router.refresh();
      } else {
        toast.error(result.error || 'An error occurred');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-generate slug from title
  const handleTitleChange = (title: string) => {
    setArticleTitle(title);
    if (!editMode || editMode.type !== 'article' || !editMode.article) {
      // Only auto-generate for new articles
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setArticleSlug(slug);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-main">Manage Resources</h1>
            <p className="text-dim mt-1">
              Create and edit resource articles
            </p>
          </div>
        </div>

        {/* Article Editor */}
        {editMode.type === 'article' && (
          <div className="bg-medium border border-main rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-main">
                {editMode.article ? 'Edit Article' : 'Add New Article'}
              </h2>
              <button
                type="button"
                onClick={() => setEditMode({ type: 'none' })}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitArticle} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-1">
                  <label
                    htmlFor="articleIcon"
                    className="block text-sm font-medium text-main mb-1"
                  >
                    Icon
                  </label>
                  <input
                    type="text"
                    id="articleIcon"
                    value={articleIcon}
                    onChange={(e) => setArticleIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl"
                    placeholder="📄"
                    maxLength={2}
                  />
                </div>
                <div className="md:col-span-3">
                  <label
                    htmlFor="articleTitle"
                    className="block text-sm font-medium text-main mb-1"
                  >
                    Article Title *
                  </label>
                  <input
                    type="text"
                    id="articleTitle"
                    value={articleTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Navigating Epic"
                  />
                </div>
                <div className="md:col-span-2">
                  <label
                    htmlFor="articleSlug"
                    className="block text-sm font-medium text-main mb-1"
                  >
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    id="articleSlug"
                    value={articleSlug}
                    onChange={(e) => setArticleSlug(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="navigating-epic"
                    pattern="[a-z0-9\-]+"
                    title="Only lowercase letters, numbers, and hyphens"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-main mb-2">
                  Content *
                </label>
                <TipTapEditor
                  content={articleContent}
                  onChange={setArticleContent}
                  placeholder="Start writing your article..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditMode({ type: 'none' })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sections List */}
        {editMode.type === 'none' && (
          <div className="space-y-6">
            {initialSections.length === 0 ? (
              <div className="text-center py-12 bg-medium border border-main rounded-lg">
                <FiFolder className="mx-auto text-4xl text-gray-400 mb-3" />
                <p className="text-dim text-lg">No sections available</p>
                <p className="text-dim text-sm mt-1">
                  Contact an admin to create sections
                </p>
              </div>
            ) : (
              initialSections.map((section) => (
                <div
                  key={section.id}
                  className="bg-medium border border-main rounded-lg p-6"
                >
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{section.icon || '📁'}</span>
                      <div>
                        <h3 className="text-xl font-semibold text-main">
                          {section.title}
                        </h3>
                        <p className="text-sm text-dim">
                          {section.children?.length || 0} article(s)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCreateArticle(section.id)}
                      className="p-2 text-green-600 hover:bg-green-600/10 rounded-lg transition-colors"
                      title="Add Article"
                    >
                      <FiPlus size={18} />
                    </button>
                  </div>

                  {/* Articles List */}
                  {section.children && section.children.length > 0 ? (
                    <div className="space-y-2">
                      {section.children.map((article) => (
                        <div
                          key={article.id}
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FiFile className="text-gray-400" />
                            <span className="text-lg">{article.icon || '📄'}</span>
                            <div>
                              <h4 className="text-sm font-medium text-main">
                                {article.title}
                              </h4>
                              <p className="text-xs text-dim">/{article.slug}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditArticle(section.id, article)}
                              className="p-2 text-blue-600 hover:bg-blue-600/10 rounded-lg transition-colors"
                              title="Edit Article"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteArticle(article)}
                              className="p-2 text-red-600 hover:bg-red-600/10 rounded-lg transition-colors"
                              title="Delete Article"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <FiFile className="mx-auto text-2xl text-gray-400 mb-2" />
                      <p className="text-dim text-sm">No articles in this section</p>
                      <button
                        type="button"
                        onClick={() => handleCreateArticle(section.id)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Add your first article
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
