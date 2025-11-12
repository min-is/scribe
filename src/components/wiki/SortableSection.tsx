'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WikiSection } from '@/provider/wiki-schema';

interface SortableSectionProps {
  section: WikiSection;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}

export function SortableSection({
  section,
  isEditing,
  onEdit,
  onDelete,
  onToggleVisibility,
}: SortableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-2 p-3 bg-medium border border-main rounded-lg
        ${isEditing ? 'ring-2 ring-blue-500' : ''}
        ${!section.visible ? 'opacity-60' : ''}
      `}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-dim hover:text-main"
        title="Drag to reorder"
      >
        ☰
      </button>

      {/* Section Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-main truncate">{section.title}</div>
        <div className="text-xs text-dim">
          {section.type} • {section.visible ? 'Visible' : 'Hidden'}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1">
        <button
          onClick={onToggleVisibility}
          className="p-2 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
          title={section.visible ? 'Hide section' : 'Show section'}
        >
          {section.visible ? '👁️' : '👁️‍🗨️'}
        </button>

        <button
          onClick={onEdit}
          className="p-2 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
          title="Edit section"
        >
          ✏️
        </button>

        <button
          onClick={onDelete}
          className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
          title="Delete section"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
