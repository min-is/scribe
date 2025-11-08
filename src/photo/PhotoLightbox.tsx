'use client';

import { Photo } from '@/photo';

// Stub component for photo lightbox
// TODO: Implement full PhotoLightbox component

export default function PhotoLightbox({
  photo,
  photos,
  tag,
  count,
  maxPhotosToShow,
  moreLink,
  onClose,
}: {
  photo?: Photo
  photos?: Photo[]
  tag?: string
  count?: number
  maxPhotosToShow?: number
  moreLink?: string
  onClose?: () => void
}) {
  if (!photo && (!photos || photos.length === 0)) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="max-w-4xl max-h-screen p-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-white">
          Close
        </button>
        <div className="text-white">
          {photo && <div>Photo: {photo.id}</div>}
          {tag && <div>Tag: {tag}</div>}
          {count !== undefined && <div>{count} photos</div>}
        </div>
      </div>
    </div>
  );
}
