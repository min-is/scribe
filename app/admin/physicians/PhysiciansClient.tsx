'use client';

import { useState } from 'react';
import { PhysicianDirectory } from '@prisma/client';
import {
  createPhysicianDirectory,
  updatePhysicianDirectory,
  deletePhysicianDirectory,
  PhysicianDirectoryFormData,
} from '@/physician-directory/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type PhysiciansClientProps = {
  physicians: PhysicianDirectory[];
};

export default function PhysiciansClient({
  physicians: initialPhysicians,
}: PhysiciansClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingPhysician, setEditingPhysician] = useState<PhysicianDirectory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const data: PhysicianDirectoryFormData = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      specialty: formData.get('specialty') as string,
    };

    try {
      const result = editingPhysician
        ? await updatePhysicianDirectory(editingPhysician.id, data)
        : await createPhysicianDirectory(data);

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
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    const result = await deletePhysicianDirectory(id);

    if (result.success) {
      toast.success('Physician deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete physician');
    }
  };

  const handleEdit = (physician: PhysicianDirectory) => {
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
            <h1 className="text-3xl font-bold text-main">Manage Physician Directory</h1>
            <p className="text-dim mt-1">
              Add and manage physicians in the hospital directory
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
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
                    placeholder="john-smith"
                    pattern="[a-z0-9\-]+"
                    title="Only lowercase letters, numbers, and hyphens"
                  />
                  <p className="text-xs text-dim mt-1">
                    Used in URL: /physicians/john-smith
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="specialty"
                  className="block text-sm font-medium text-main mb-1"
                >
                  Specialty *
                </label>
                <input
                  type="text"
                  id="specialty"
                  name="specialty"
                  required
                  defaultValue={editingPhysician?.specialty || ''}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cardiology"
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
                    : editingPhysician
                      ? 'Update Physician'
                      : 'Create Physician'}
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
          {initialPhysicians.length === 0 ? (
            <div className="px-6 py-12 text-center text-zinc-400">
              <p>No physicians added yet.</p>
              <p className="text-sm mt-1">
                Click &quot;Add Physician&quot; to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-900/50 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Specialty
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      URL Slug
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {initialPhysicians.map((physician) => (
                    <tr
                      key={physician.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-100">
                        {physician.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 leading-relaxed">
                        {physician.specialty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-zinc-400 leading-relaxed">
                        {physician.slug}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleEdit(physician)}
                          className="p-2 text-blue-400 hover:bg-blue-600/10 rounded-md transition-colors duration-150"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(physician.id, physician.name)
                          }
                          className="p-2 text-red-400 hover:bg-red-600/10 rounded-md transition-colors duration-150"
                          title="Delete"
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
