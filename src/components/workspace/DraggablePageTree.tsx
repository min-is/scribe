'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, ChevronDown, GripVertical, FileText } from 'lucide-react';
import { clsx } from 'clsx/lite';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PageNode {
  id: string;
  slug: string;
  title: string;
  icon: string | null;
  type: string;
  position: string;
  children: PageNode[];
  _count: {
    children: number;
  };
}

interface DraggablePageTreeProps {
  type?: string;
}

export default function DraggablePageTree({ type }: DraggablePageTreeProps) {
  const [pages, setPages] = useState<PageNode[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchPages();
  }, [type]);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const url = type ? `/api/pages?type=${type}&parentId=null` : '/api/pages?parentId=null';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }

      const data = await response.json();
      setPages(data);
    } catch (err) {
      console.error('Error fetching pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = pages.findIndex((p) => p.id === active.id);
    const newIndex = pages.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update UI
    const newPages = arrayMove(pages, oldIndex, newIndex);
    setPages(newPages);

    // Determine before/after IDs for position calculation
    const beforeId = newIndex > 0 ? newPages[newIndex - 1].id : null;
    const afterId = newIndex < newPages.length - 1 ? newPages[newIndex + 1].id : null;

    // Update position on server
    try {
      const response = await fetch(`/api/pages/${active.id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: null,
          beforeId,
          afterId,
        }),
      });

      if (!response.ok) {
        // Revert on error
        setPages(pages);
      }
    } catch (error) {
      console.error('Error moving page:', error);
      // Revert on error
      setPages(pages);
    }
  };

  if (loading) {
    return (
      <div className="p-3 text-sm text-dim">
        Loading pages...
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="p-3 text-sm text-dim">
        No pages yet
      </div>
    );
  }

  const activePage = activeId ? pages.find((p) => p.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="py-2">
          {pages.map((page) => (
            <SortablePageNode
              key={page.id}
              page={page}
              level={0}
              currentPath={pathname}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activePage ? (
          <div className="bg-medium border border-main rounded-md px-3 py-1.5 shadow-lg opacity-90">
            <div className="flex items-center gap-2">
              <span className="text-base">{activePage.icon || <FileText size={14} />}</span>
              <span className="text-sm">{activePage.title}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface SortablePageNodeProps {
  page: PageNode;
  level: number;
  currentPath: string | null;
}

function SortablePageNode({ page, level, currentPath }: SortablePageNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<PageNode[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const hasChildren = page._count.children > 0;
  const isActive = currentPath === `/workspace/pages/${page.slug}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const loadChildren = async () => {
    if (children.length > 0 || isLoadingChildren) return;

    try {
      setIsLoadingChildren(true);
      const response = await fetch(`/api/pages?parentId=${page.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }

      const data = await response.json();
      setChildren(data);
    } catch (err) {
      console.error('Error loading children:', err);
    } finally {
      setIsLoadingChildren(false);
    }
  };

  const handleToggle = async () => {
    if (!isExpanded && hasChildren) {
      await loadChildren();
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={clsx(
          'flex items-center gap-1 rounded-md text-sm transition-colors group',
          isActive
            ? 'bg-dim text-main font-medium'
            : 'text-dim hover:bg-dim hover:text-main'
        )}
        style={{ paddingLeft: `${level * 12 + 12}px` }}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-medium rounded cursor-grab active:cursor-grabbing transition-opacity"
        >
          <GripVertical size={14} />
        </button>

        {/* Expand/Collapse */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-0.5 hover:bg-medium rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Page Link */}
        <Link
          href={`/workspace/pages/${page.slug}`}
          className="flex items-center gap-2 flex-1 min-w-0 py-1.5 pr-3"
        >
          <span className="text-base flex-shrink-0">
            {page.icon || <FileText size={14} />}
          </span>
          <span className="truncate">{page.title}</span>
        </Link>
      </div>

      {isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <SortablePageNode
              key={child.id}
              page={child}
              level={level + 1}
              currentPath={currentPath}
            />
          ))}
        </div>
      )}

      {isExpanded && isLoadingChildren && (
        <div
          className="text-xs text-dim px-3 py-1"
          style={{ paddingLeft: `${(level + 1) * 12 + 12}px` }}
        >
          Loading...
        </div>
      )}
    </div>
  );
}
