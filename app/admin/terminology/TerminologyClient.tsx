'use client';

import { useState } from 'react';
import { Terminology } from '@prisma/client';
import {
  createTerminology,
  updateTerminology,
  deleteTerminology,
  TerminologyFormData,
} from '@/terminology/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FiEdit, FiTrash2 } from 'react-icons/fi';

type TerminologyClientProps = {
  terminologies: Terminology[];
};

export default function TerminologyClient({
  terminologies: initialTerminologies,
}: TerminologyClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingTerminology, setEditingTerminology] = useState<Terminology | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const examplesRaw = formData.get('examples') as string;
    const examples = examplesRaw
      ? examplesRaw.split('\n').map(e => e.trim()).filter(e => e.length > 0)
      : [];

    const data: TerminologyFormData = {
      term: formData.get('term') as string,
      slug: formData.get('slug') as string,
      definition: formData.get('definition') as string,
      category: formData.get('category') as string,
      examples,
    };

    try {
      const result = editingTerminology
        ? await updateTerminology(editingTerminology.id, data)
        : await createTerminology(data);

      if (result.success) {
        toast.success(
          editingTerminology
            ? 'Terminology updated successfully'
            : 'Terminology created successfully',
        );
        setShowForm(false);
        setEditingTerminology(null);
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

  const handleDelete = async (id: string, term: string) => {
    if (!confirm(`Are you sure you want to delete ${term}?`)) {
      return;
    }

    const result = await deleteTerminology(id);

    if (result.success) {
      toast.success('Terminology deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete terminology');
    }
  };

  const handleEdit = (terminology: Terminology) => {
    setEditingTerminology(terminology);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTerminology(null);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-main">Manage Terminology</h1>
            <p className="text-dim mt-1">
              Add and manage medical terminology entries
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Add Terminology
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-medium border border-main rounded-lg p-6">
            <h2 className="text-xl font-semibold text-main mb-4">
              {editingTerminology ? 'Edit Terminology' : 'Add New Terminology'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="term"
                    className="block text-sm font-medium text-main mb-1"
                  >
                    Term/Abbreviation *
                  </label>
                  <input
                    type="text"
                    id="term"
                    name="term"
                    required
                    defaultValue={editingTerminology?.term || ''}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="BP"
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
                    defaultValue={editingTerminology?.slug || ''}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="bp"
                    pattern="[a-z0-9\-]+"
                    title="Only lowercase letters, numbers, and hyphens"
                  />
                  <p className="text-xs text-dim mt-1">
                    Used in URL: /terminology/bp
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="definition"
                  className="block text-sm font-medium text-main mb-1"
                >
                  Definition *
                </label>
                <input
                  type="text"
                  id="definition"
                  name="definition"
                  required
                  defaultValue={editingTerminology?.definition || ''}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Blood Pressure"
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-main mb-1"
                >
                  Category *
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  required
                  defaultValue={editingTerminology?.category || ''}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Vital Signs"
                />
              </div>

              <div>
                <label
                  htmlFor="examples"
                  className="block text-sm font-medium text-main mb-1"
                >
                  Examples (one per line)
                </label>
                <textarea
                  id="examples"
                  name="examples"
                  rows={3}
                  defaultValue={editingTerminology?.examples.join('\n') || ''}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="BP 120/80 mmHg"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="font-admin px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? 'Saving...'
                    : editingTerminology
                      ? 'Update Terminology'
                      : 'Create Terminology'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="font-admin px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          {initialTerminologies.length === 0 ? (
            <div className="px-6 py-12 text-center text-zinc-400">
              <p>No terminology entries added yet.</p>
              <p className="text-sm mt-1">
                Click &quot;Add Terminology&quot; to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-900/50 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Term
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Definition
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {initialTerminologies.map((terminology) => (
                    <tr
                      key={terminology.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-100">
                        {terminology.term}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400 leading-relaxed">
                        {terminology.definition}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                        {terminology.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleEdit(terminology)}
                            className="p-2 text-blue-400 hover:bg-blue-600/10 rounded-md transition-colors duration-150"
                            title="Edit"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(terminology.id, terminology.term)
                            }
                            className="p-2 text-red-400 hover:bg-red-600/10 rounded-md transition-colors duration-150"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
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
