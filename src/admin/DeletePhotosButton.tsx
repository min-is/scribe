'use client';

import LoaderButton from '@/components/primitives/LoaderButton';
import { BiTrash } from 'react-icons/bi';

// Stub component for delete photos button
// TODO: Implement full DeletePhotosButton component

export default function DeletePhotosButton({
  photoIds,
  disabled,
  onClick,
  onDelete,
  onFinish,
}: {
  photoIds?: string[]
  disabled?: boolean
  onClick?: () => void
  onDelete?: () => void
  onFinish?: () => void
}) {
  return (
    <LoaderButton
      icon={<BiTrash />}
      disabled={disabled}
      confirmText={`Are you sure you want to delete ${photoIds?.length || 0} photo(s)?`}
      onClick={() => {
        onClick?.();
        // Stub implementation
        console.log('Delete photos:', photoIds);
        onDelete?.();
        onFinish?.();
      }}
    >
      Delete
    </LoaderButton>
  );
}
