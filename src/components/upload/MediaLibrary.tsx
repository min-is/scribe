'use client';

import { MediaItem } from '@/provider/wiki-schema';
import Image from 'next/image';

interface MediaLibraryProps {
  media: MediaItem[];
  onSelect?: (media: MediaItem) => void;
  onDelete?: (mediaId: string) => void;
  selectable?: boolean;
}

export function MediaLibrary({
  media,
  onSelect,
  onDelete,
  selectable = false,
}: MediaLibraryProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoString: string): string => {
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (media.length === 0) {
    return (
      <div className="text-center py-8 text-dim">
        <p>No media uploaded yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {media.map((item) => (
        <div
          key={item.id}
          className={`
            relative group border border-main rounded-lg overflow-hidden
            ${selectable ? 'cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all' : ''}
          `}
          onClick={() => selectable && onSelect?.(item)}
        >
          {/* Media Preview */}
          <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
            {item.type === 'image' ? (
              <Image
                src={item.url}
                alt={item.altText || item.filename}
                fill
                className="object-cover"
              />
            ) : item.type === 'video' ? (
              <video
                src={item.url}
                className="w-full h-full object-cover"
                muted
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <svg
                  className="h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
            )}

            {/* Hover overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <svg
                  className="h-5 w-5 text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </a>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this media?')) {
                      onDelete(item.id);
                    }
                  }}
                  className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                >
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Media Info */}
          <div className="p-2 space-y-1">
            <p className="text-xs font-medium text-main truncate" title={item.filename}>
              {item.filename}
            </p>
            <div className="flex justify-between text-xs text-dim">
              <span>{formatFileSize(item.size)}</span>
              <span>{formatDate(item.uploadedAt)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
