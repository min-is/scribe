'use client';

import { useState } from 'react';
import { WikiSection } from '@/provider/wiki-schema';
import { RichTextEditor } from '../editor/RichTextEditor';

interface SectionEditorProps {
  section: WikiSection;
  onSave: (section: WikiSection) => void;
  onCancel: () => void;
}

export function SectionEditor({ section, onSave, onCancel }: SectionEditorProps) {
  const [editedSection, setEditedSection] = useState<WikiSection>(section);

  const handleSave = () => {
    const updated: WikiSection = {
      ...editedSection,
      updatedAt: new Date().toISOString(),
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={editedSection.title}
            onChange={(e) =>
              setEditedSection({ ...editedSection, title: e.target.value })
            }
            className="text-2xl font-bold text-main bg-transparent border-none outline-none w-full"
            placeholder="Section title..."
          />
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-4">
          <RichTextEditor
            content={editedSection.content}
            onChange={(content) =>
              setEditedSection({ ...editedSection, content })
            }
            placeholder="Start writing..."
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="text-sm text-dim">
            {editedSection.type} • {editedSection.visible ? 'Visible' : 'Hidden'}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
