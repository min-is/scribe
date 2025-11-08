import { Photo } from '@/photo';

// Stub component for small photo display
// TODO: Implement full PhotoSmall component

export default function PhotoSmall({
  photo,
  className,
  onClick,
}: {
  photo: Photo
  className?: string
  onClick?: () => void
}) {
  return (
    <div className={className} onClick={onClick}>
      <div className="text-xs">Photo: {photo.id}</div>
    </div>
  );
}
