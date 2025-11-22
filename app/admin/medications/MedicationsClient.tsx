'use client';

import { useState } from 'react';
import { Medication } from '@prisma/client';
import {
  createMedication,
  updateMedication,
  deleteMedication,
  MedicationFormData,
} from '@/medication/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type MedicationsClientProps = {
  medications: Medication[];
};

export default function MedicationsClient({
  medications: initialMedications,
}: MedicationsClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const data: MedicationFormData = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      type: formData.get('type') as string,
      commonlyUsedFor: (formData.get('commonlyUsedFor') as string) || undefined,
    };

    try {
      const result = editingMedication
        ? await updateMedication(editingMedication.id, data)
        : await createMedication(data);

      if (result.success) {
        toast.success(
          editingMedication
            ? 'Medication updated successfully'
            : 'Medication created successfully',
        );
        setShowForm(false);
        setEditingMedication(null);
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

    const result = await deleteMedication(id);

    if (result.success) {
      toast.success('Medication deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete medication');
    }
  };

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingMedication(null);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-main">Manage Medications</h1>
            <p className="text-dim mt-1">
              Add and manage medication entries for quick reference
            </p>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
            >
              Add Medication
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-medium border border-main rounded-lg p-6">
            <h2 className="text-xl font-semibold text-main mb-4">
              {editingMedication ? 'Edit Medication' : 'Add New Medication'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-main mb-1"
                  >
                    Medication Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    defaultValue={editingMedication?.name || ''}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Acetaminophen"
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
                    defaultValue={editingMedication?.slug || ''}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="acetaminophen"
                    pattern="[a-z0-9\-]+"
                    title="Only lowercase letters, numbers, and hyphens"
                  />
                  <p className="text-xs text-dim mt-1">
                    Used in URL: /medications/acetaminophen
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-main mb-1"
                >
                  Type *
                </label>
                <input
                  type="text"
                  id="type"
                  name="type"
                  required
                  defaultValue={editingMedication?.type || ''}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Analgesic"
                />
              </div>

              <div>
                <label
                  htmlFor="commonlyUsedFor"
                  className="block text-sm font-medium text-main mb-1"
                >
                  Commonly Used For
                </label>
                <textarea
                  id="commonlyUsedFor"
                  name="commonlyUsedFor"
                  rows={3}
                  defaultValue={editingMedication?.commonlyUsedFor || ''}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Pain relief, fever reduction"
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
                    : editingMedication
                      ? 'Update Medication'
                      : 'Create Medication'}
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
          {initialMedications.length === 0 ? (
            <div className="px-6 py-12 text-center text-zinc-400">
              <p>No medications added yet.</p>
              <p className="text-sm mt-1">
                Click &quot;Add Medication&quot; to get started.
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
                      Type
                    </th>
                    <th className="px-6 py-3.5 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Commonly Used For
                    </th>
                    <th className="px-6 py-3.5 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {initialMedications.map((medication) => (
                    <tr
                      key={medication.id}
                      className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-100">
                        {medication.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 leading-relaxed">
                        {medication.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400 leading-relaxed">
                        {medication.commonlyUsedFor || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleEdit(medication)}
                          className="p-2 text-blue-400 hover:bg-blue-600/10 rounded-md transition-colors duration-150"
                          title="Edit"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(medication.id, medication.name)
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
