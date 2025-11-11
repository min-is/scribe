'use client';

import { useState } from 'react';
import { Provider } from '@prisma/client';
import {
  createProvider,
  updateProvider,
  deleteProvider,
  ProviderFormData,
} from '@/provider/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { DifficultyDialInput } from '@/components/DifficultyDialInput';
import { ProviderDifficultyPreview } from '@/components/ProviderDifficultyPreview';

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data: ProviderFormData = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      credentials: formData.get('credentials') as string,
      noteTemplate: formData.get('noteTemplate') as string,
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
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProvider(null);
    resetDifficultyFields();
  };

  const resetDifficultyFields = () => {
    setGeneralDifficulty(undefined);
    setSpeedDifficulty(undefined);
    setTerminologyDifficulty(undefined);
    setNoteDifficulty(undefined);
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

              <div>
                <label
                  htmlFor="noteTemplate"
                  className="block text-sm font-medium text-main mb-1"
                >
                  Note Template
                </label>
                <textarea
                  id="noteTemplate"
                  name="noteTemplate"
                  rows={6}
                  defaultValue={editingProvider?.noteTemplate || ''}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Default note template for this provider..."
                />
                <p className="text-xs text-dim mt-1">
                  This template will be used as the default for this
                  provider&apos;s notes
                </p>
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
                          onClick={() => handleEdit(provider)}
                          className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(provider.id, provider.name)
                          }
                          className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
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
