'use client';

import TagInput from '@/components/TagInput';
import { Tags } from '@/tag';

// Stub component for photo tag fieldset
// TODO: Implement full PhotoTagFieldset component

export default function PhotoTagFieldset({
  tags,
  tagOptions,
  placeholder,
  onChange,
  onError,
  readOnly,
  openOnLoad,
  hideLabel,
}: {
  tags?: string
  tagOptions?: Tags
  placeholder?: string
  onChange?: (value: string) => void
  onError?: (error: string) => void
  readOnly?: boolean
  openOnLoad?: boolean
  hideLabel?: boolean
}) {
  return (
    <div>
      <TagInput
        value={tags || ''}
        onChange={onChange || (() => {})}
        placeholder={placeholder}
        disabled={readOnly}
      />
    </div>
  );
}
