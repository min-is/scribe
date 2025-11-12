'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { WikiSection, SectionType, SECTION_TEMPLATES, createSection } from '@/provider/wiki-schema';
import { SectionEditor } from './SectionEditor';
import { SortableSection } from './SortableSection';

interface SectionManagerProps {
  sections: WikiSection[];
  onChange: (sections: WikiSection[]) => void;
}

export function SectionManager({ sections, onChange }: SectionManagerProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      const reorderedSections = arrayMove(sections, oldIndex, newIndex).map(
        (section, index) => ({
          ...section,
          order: index,
        }),
      );

      onChange(reorderedSections);
    }
  };

  const addSection = (type: SectionType) => {
    const template = SECTION_TEMPLATES[type];
    const newSection = createSection(type, template.title, sections.length);
    onChange([...sections, newSection]);
    setEditingSection(newSection.id);
    setShowAddMenu(false);
  };

  const updateSection = (updatedSection: WikiSection) => {
    const updatedSections = sections.map((s) =>
      s.id === updatedSection.id ? updatedSection : s,
    );
    onChange(updatedSections);
  };

  const deleteSection = (sectionId: string) => {
    if (confirm('Delete this section?')) {
      const filtered = sections.filter((s) => s.id !== sectionId);
      onChange(filtered);
      if (editingSection === sectionId) {
        setEditingSection(null);
      }
    }
  };

  const toggleVisibility = (sectionId: string) => {
    const updated = sections.map((s) =>
      s.id === sectionId ? { ...s, visible: !s.visible } : s,
    );
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Section List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                isEditing={editingSection === section.id}
                onEdit={() => setEditingSection(section.id)}
                onDelete={() => deleteSection(section.id)}
                onToggleVisibility={() => toggleVisibility(section.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add Section Button */}
      <div className="relative">
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full py-2 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-dim hover:text-main"
        >
          + Add Section
        </button>

        {showAddMenu && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-main rounded-lg shadow-lg z-10 p-2">
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SECTION_TEMPLATES) as SectionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => addSection(type)}
                  className="text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="font-medium text-main">
                    {SECTION_TEMPLATES[type].title}
                  </div>
                  <div className="text-xs text-dim mt-1">
                    {SECTION_TEMPLATES[type].placeholder.substring(0, 50)}...
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section Editor Modal */}
      {editingSection && (
        <SectionEditor
          section={sections.find((s) => s.id === editingSection)!}
          onSave={(updated) => {
            updateSection(updated);
            setEditingSection(null);
          }}
          onCancel={() => setEditingSection(null)}
        />
      )}
    </div>
  );
}
