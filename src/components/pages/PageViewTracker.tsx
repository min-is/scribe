'use client';

import { useEffect } from 'react';

export function PageViewTracker({ pageId }: { pageId: string }) {
  useEffect(() => {
    // Increment view count asynchronously without blocking render
    const incrementView = async () => {
      try {
        await fetch(`/api/pages/${pageId}/increment-view`, {
          method: 'POST',
        });
      } catch (error) {
        // Silently fail - view tracking is not critical
        console.error('Failed to track page view:', error);
      }
    };

    incrementView();
  }, [pageId]);

  return null; // This component doesn't render anything
}
