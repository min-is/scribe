'use client';

import { DifficultyDial } from './DifficultyDial';

interface ProviderDifficultyFullProps {
  generalDifficulty?: number | null;
}

/**
 * Shows the general difficulty dial
 * Used in: full provider profile modal
 */
export function ProviderDifficultyFull({
  generalDifficulty,
}: ProviderDifficultyFullProps) {
  if (!generalDifficulty) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No difficulty metrics set for this provider
      </div>
    );
  }

  return (
    <div className="flex justify-center py-4">
      <DifficultyDial
        value={generalDifficulty}
        label="General Difficulty"
        size="medium"
        showValue={true}
      />
    </div>
  );
}
