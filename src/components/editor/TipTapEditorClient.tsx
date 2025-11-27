'use client';

import dynamic from 'next/dynamic';
import { JSONContent } from '@tiptap/core';

// Lazy load TipTapEditor to reduce initial bundle size
const TipTapEditor = dynamic(
  () => import('@/components/editor/TipTapEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
      </div>
    ),
  }
);

interface TipTapEditorClientProps {
  content: JSONContent;
  editable?: boolean;
  className?: string;
  onChange?: (content: JSONContent) => void;
}

export default function TipTapEditorClient({
  content,
  editable = false,
  className,
  onChange,
}: TipTapEditorClientProps) {
  return (
    <TipTapEditor
      content={content}
      editable={editable}
      className={className}
      onChange={onChange}
    />
  );
}
