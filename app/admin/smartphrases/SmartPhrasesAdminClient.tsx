'use client';

import { useState } from 'react';
import { SmartPhrase } from '@prisma/client';
import {
  createSmartPhrase,
  updateSmartPhrase,
  deleteSmartPhrase,
  SmartPhraseFormData,
} from '@/smartphrase/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FiEdit, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

type SmartPhrasesAdminClientProps = {
  smartphrases: SmartPhrase[];
  existingCategories: string[];
};

export default function SmartPhrasesAdminClient({
  smartphrases: initialSmartPhrases,
  existingCategories,
}: SmartPhrasesAdminClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingPhrase, setEditingPhrase] = useState<SmartPhrase | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');

  const resetForm = () => {
    setSlug('');
    setTitle('');
    setCategory('');
    setDescription('');
    setContent('');
    setTags('');
    setEditingPhrase(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const data: SmartPhraseFormData = {
      slug,
      title,
      category,
      description: description || undefined,
      content,
      tags: tagsArray,
    };

    try {
      const result = editingPhrase
        ? await updateSmartPhrase(editingPhrase.id, data)
        : await createSmartPhrase(data);

      if (result.success) {
        toast.success(
          editingPhrase
            ? 'SmartPhrase updated successfully'
            : 'SmartPhrase created successfully',
        );
        resetForm();
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

  const handleDelete = async (id: string, phraseSlug: string) => {
    if (!confirm(`Are you sure you want to delete ${phraseSlug}?`)) {
      return;
    }

    const result = await deleteSmartPhrase(id);

    if (result.success) {
      toast.success('SmartPhrase deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete SmartPhrase');
    }
  };

  const handleEdit = (phrase: SmartPhrase) => {
    setEditingPhrase(phrase);
    setSlug(phrase.slug);
    setTitle(phrase.title);
    setCategory(phrase.category);
    setDescription(phrase.description || '');
    setContent(phrase.content);
    setTags(phrase.tags.join(', '));
    setShowForm(true);
  };

  return (
    <div className="min-h-screen p-8 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-main mb-2">
              Manage SmartPhrases
            </h1>
            <p className="text-dim text-lg">
              Create, edit, and delete EPIC SmartPhrases
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FiPlus className="text-lg" />
              Add SmartPhrase
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-medium border border-main rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-main">
                {editingPhrase ? 'Edit SmartPhrase' : 'New SmartPhrase'}
              </h2>
              <button
                onClick={resetForm}
                className="text-dim hover:text-main transition-colors"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Slug */}
                <div>
                  <label className="block text-main font-medium mb-2">
                    Slug (e.g., .PEABD)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder=".PHRASEHERE"
                    required
                    className="w-full bg-content border border-main rounded-lg px-4 py-2 text-main placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-main font-medium mb-2">
                    Title
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Physical Exam - Abdomen"
                    required
                    className="w-full bg-content border border-main rounded-lg px-4 py-2 text-main placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-main font-medium mb-2">
                    Category
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Physical Exam, HPI, MDM, etc."
                    required
                    list="categories"
                    className="w-full bg-content border border-main rounded-lg px-4 py-2 text-main placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <datalist id="categories">
                    {existingCategories.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-main font-medium mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="abdomen, physical exam, GI"
                    className="w-full bg-content border border-main rounded-lg px-4 py-2 text-main placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-main font-medium mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this SmartPhrase"
                  className="w-full bg-content border border-main rounded-lg px-4 py-2 text-main placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-main font-medium mb-2">
                  Content
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Full text of the SmartPhrase template..."
                  required
                  rows={8}
                  className="w-full bg-content border border-main rounded-lg px-4 py-2 text-main placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingPhrase
                      ? 'Update SmartPhrase'
                      : 'Create SmartPhrase'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-dim text-main rounded-lg hover:bg-content transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="bg-medium border border-main rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dim border-b border-main">
                <tr>
                  <th className="text-left px-4 py-3 text-main font-semibold text-sm">
                    Slug
                  </th>
                  <th className="text-left px-4 py-3 text-main font-semibold text-sm">
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-main font-semibold text-sm">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-main font-semibold text-sm">
                    Usage
                  </th>
                  <th className="text-right px-4 py-3 text-main font-semibold text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {initialSmartPhrases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-dim">
                      No SmartPhrases yet. Create one to get started!
                    </td>
                  </tr>
                ) : (
                  initialSmartPhrases.map((phrase, index) => (
                    <tr
                      key={phrase.id}
                      className={`border-b border-main/50 hover:bg-dim/30 transition-colors ${
                        index % 2 === 0 ? 'bg-medium' : 'bg-dim/10'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <code className="text-blue-400 font-mono text-sm bg-content px-2 py-1 rounded">
                          {phrase.slug}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-main">{phrase.title}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {phrase.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-medium text-sm">
                        {phrase.usageCount} times
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(phrase)}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleDelete(phrase.id, phrase.slug)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
