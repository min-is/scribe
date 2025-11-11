'use client';

import { useState } from 'react';
import { Physician } from '@prisma/client';
import {
  createPhysician,
  updatePhysician,
  deletePhysician,
  PhysicianFormData,
} from '@/physician';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type PhysiciansClientProps = {
  physicians: Physician[];
};

export default function PhysiciansClient({
  physicians: initialPhysicians,
}: PhysiciansClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingPhysician, setEditingPhysician] = useState<Physician | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data: PhysicianFormData = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      specialty: formData.get('specialty') as string,
      credentials: formData.get('credentials') as string,
      noteTemplate: formData.get('noteTemplate') as string,
    };

    try {
      const result = editingPhysician
        ? await updatePhysician(editingPhysician.id, data)
        : await createPhysician(data);

      if (result.success) {
        toast.success(
          editingPhysician
            ? 'Physician updated successfully'
            : 'Physician created successfully',
        );
        setShowForm(false);
        setEditingPhysician(null);
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

    const result = await deletePhysician(id);

    if (result.success) {
      toast.success('Physician deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete physician');
    }
  };

  const handleEdit = (physician: Physician) => {
    setEditingPhysician(physician);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPhysician(null);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-main">Manage Physicians</h1>
            <p className="text-dim mt-1">
              Add and manage physician profiles and preferences
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Physician
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-medium border border-main rounded-lg p-6">
            <h2 className="text-xl font-semibold text-main mb-4">
              {editingPhysician ? 'Edit Physician' : 'Add New Physician'}
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
                    defaultValue={editingPhysician?.name || ''}
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
                    defaultValue={editingPhysician?.slug || ''}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="physician-smith"
                    pattern="[a-z0-9\-]+"
                    title="Only lowercase letters, numbers, and hyphens"
                  />
                  <p className="text-xs text-dim mt-1">
                    Used in URL: #physician-smith
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="specialty"
                    className="block text-sm font-medium text-main mb-1"
                  >
                    Specialty
                  </label>
                  <input
                    type="text"
                    id="specialty"
                    name="specialty"
                    defaultValue={editingPhysician?.specialty || ''}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Internal Medicine"
                  />
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
                    defaultValue={editingPhysician?.credentials || ''}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="MD, FACP"
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
                  defaultValue={editingPhysician?.noteTemplate || ''}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Default note template for this physician..."
                />
                <p className="text-xs text-dim mt-1">
                  This template will be used as the default for this
                  physician&apos;s notes
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
                    : editingPhysician
                      ? 'Update Physician'
                      : 'Create Physician'}
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
          {initialPhysicians.length === 0 ? (
            <div className="p-8 text-center text-dim">
              <p>No physicians added yet.</p>
              <p className="text-sm mt-1">
                Click &quot;Add Physician&quot; to get started.
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
                      Specialty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dim uppercase tracking-wider">
                      Credentials
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
                  {initialPhysicians.map((physician) => (
                    <tr
                      key={physician.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-main">
                        {physician.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dim">
                        {physician.specialty || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dim">
                        {physician.credentials || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-dim">
                        #{physician.slug}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(physician)}
                          className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(physician.id, physician.name)
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
