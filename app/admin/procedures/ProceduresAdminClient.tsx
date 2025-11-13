'use client';

import { useState } from 'react';
import { Procedure } from '@prisma/client';
import {
  createProcedure,
  updateProcedure,
  deleteProcedure,
  ProcedureFormData,
} from '@/procedure/actions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FiEdit, FiTrash2, FiPlus, FiX, FiEye } from 'react-icons/fi';

type ProceduresAdminClientProps = {
  procedures: Procedure[];
  existingCategories: string[];
};

export default function ProceduresAdminClient({
  procedures: initialProcedures,
  existingCategories,
}: ProceduresAdminClientProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [indications, setIndications] = useState('');
  const [contraindications, setContraindications] = useState('');
  const [equipment, setEquipment] = useState('');
  const [steps, setSteps] = useState('');
  const [complications, setComplications] = useState('');
  const [tags, setTags] = useState('');

  const resetForm = () => {
    setSlug('');
    setTitle('');
    setCategory('');
    setDescription('');
    setIndications('');
    setContraindications('');
    setEquipment('');
    setSteps('');
    setComplications('');
    setTags('');
    setEditingProcedure(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const tagsArray = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const data: ProcedureFormData = {
      slug,
      title,
      category,
      description: description || undefined,
      indications: indications || undefined,
      contraindications: contraindications || undefined,
      equipment: equipment || undefined,
      steps,
      complications: complications || undefined,
      tags: tagsArray,
    };

    try {
      const result = editingProcedure
        ? await updateProcedure(editingProcedure.id, data)
        : await createProcedure(data);

      if (result.success) {
        toast.success(
          editingProcedure
            ? 'Procedure updated successfully'
            : 'Procedure created successfully',
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

  const handleDelete = async (id: string, procedureTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${procedureTitle}"?`)) {
      return;
    }

    const result = await deleteProcedure(id);

    if (result.success) {
      toast.success('Procedure deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete Procedure');
    }
  };

  const handleEdit = (procedure: Procedure) => {
    setEditingProcedure(procedure);
    setSlug(procedure.slug);
    setTitle(procedure.title);
    setCategory(procedure.category);
    setDescription(procedure.description || '');
    setIndications(procedure.indications || '');
    setContraindications(procedure.contraindications || '');
    setEquipment(procedure.equipment || '');
    setSteps(procedure.steps);
    setComplications(procedure.complications || '');
    setTags(procedure.tags.join(', '));
    setShowForm(true);
  };

  return (
    <div className="min-h-screen p-8 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-main mb-2">
              Manage Procedures
            </h1>
            <p className="text-dim text-lg">
              Create, edit, and delete medical procedure guides
            </p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <FiPlus className="text-lg" />
              Add Procedure
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-medium border border-main rounded-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-main">
                {editingProcedure ? 'Edit Procedure' : 'New Procedure'}
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
                    Slug (URL-friendly)
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="lumbar-puncture"
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
                    placeholder="Lumbar Puncture"
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
                    placeholder="Neurology, Emergency, ICU, etc."
                    required
                    list="procedure-categories"
                    className="w-full bg-content border border-main rounded-lg px-4 py-2 text-main placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                  <datalist id="procedure-categories">
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
                    placeholder="neurology, diagnostic, CSF"
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
                  placeholder="Brief overview of this procedure"
                  className="w-full bg-content border border-main rounded-lg px-4 py-2 text-main placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              {/* Indications */}
              <div>
                <label className="block text-main font-medium mb-2">
                  Indications (when to perform)
                </label>
                <textarea
                  value={indications}
                  onChange={(e) => setIndications(e.target.value)}
                  placeholder="List indications for this procedure..."
                  rows={3}
                  className="w-full bg-content border border-main rounded-lg px-4 py-2 text-main placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm"
                />
              </div>

              {/* Contraindications */}
              <div>
                <label className="block text-main font-medium mb-2">
                  Contraindications (when NOT to perform)
                </label>
                <textarea
                  value={contraindications}
                  onChange={(e) => setContraindications(e.target.value)}
                  placeholder="List contraindications for this procedure..."
                  rows={3}
                  className="w-full bg-content border border-main rounded-lg px-4 py-2 text-main placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm"
                />
              </div>

              {/* Equipment */}
              <div>
                <label className="block text-main font-medium mb-2">
                  Equipment/Supplies
                </label>
                <textarea
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  placeholder="List required equipment and supplies..."
                  rows={3}
                  className="w-full bg-content border border-main rounded-lg px-4 py-2 text-main placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm"
                />
              </div>

              {/* Steps */}
              <div>
                <label className="block text-main font-medium mb-2">
                  Procedure Steps
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  placeholder="Detailed step-by-step instructions..."
                  required
                  rows={8}
                  className="w-full bg-content border border-main rounded-lg px-4 py-2 text-main placeholder:text-dim focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-mono text-sm"
                />
              </div>

              {/* Complications */}
              <div>
                <label className="block text-main font-medium mb-2">
                  Potential Complications
                </label>
                <textarea
                  value={complications}
                  onChange={(e) => setComplications(e.target.value)}
                  placeholder="List potential complications..."
                  rows={3}
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
                    : editingProcedure
                      ? 'Update Procedure'
                      : 'Create Procedure'}
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
                    Title
                  </th>
                  <th className="text-left px-4 py-3 text-main font-semibold text-sm">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-main font-semibold text-sm">
                    Views
                  </th>
                  <th className="text-right px-4 py-3 text-main font-semibold text-sm">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {initialProcedures.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-dim">
                      No Procedures yet. Create one to get started!
                    </td>
                  </tr>
                ) : (
                  initialProcedures.map((procedure, index) => (
                    <tr
                      key={procedure.id}
                      className={`border-b border-main/50 hover:bg-dim/30 transition-colors ${
                        index % 2 === 0 ? 'bg-medium' : 'bg-dim/10'
                      }`}
                    >
                      <td className="px-4 py-3 text-main font-medium">
                        {procedure.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {procedure.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-medium text-sm">
                        <div className="flex items-center gap-1">
                          <FiEye className="text-sm" />
                          {procedure.viewCount}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(procedure)}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FiEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(procedure.id, procedure.title)
                            }
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
