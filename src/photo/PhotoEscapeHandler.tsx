'use client';

import { useEffect } from 'react';

// Stub component for photo escape handler
// TODO: Implement full PhotoEscapeHandler component

export default function PhotoEscapeHandler({
  onEscape,
}: {
  onEscape?: () => void
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape]);

  return null;
}
