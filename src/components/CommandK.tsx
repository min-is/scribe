'use client';

import { useAppState } from '@/state/AppState';
import SearchModal from './SearchModal';

export default function CommandK() {
  const { isCommandKOpen, setIsCommandKOpen } = useAppState();

  return (
    <SearchModal
      isOpen={isCommandKOpen ?? false}
      onClose={() => setIsCommandKOpen?.(false)}
    />
  );
}
