'use client';

import { DifficultyDial } from './DifficultyDial';

interface ProviderDifficultyPreviewProps {
  generalDifficulty?: number | null;
  size?: 'xs' | 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

/**
 * Shows only the general difficulty dial for preview purposes
 * Used in: card grids, search results, list previews
 */
export function ProviderDifficultyPreview({
  generalDifficulty,
  size = 'small',
  showLabel = false,
}: ProviderDifficultyPreviewProps) {
  return (
    <DifficultyDial
      value={generalDifficulty}
      label={showLabel ? 'Difficulty' : undefined}
      size={size}
      showValue={true}
    />
  );
}
