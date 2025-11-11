'use client';

import { DifficultyDial } from './DifficultyDial';

interface ProviderDifficultyFullProps {
  generalDifficulty?: number | null;
  speedDifficulty?: number | null;
  terminologyDifficulty?: number | null;
  noteDifficulty?: number | null;
}

/**
 * Shows all 4 difficulty dials in a 2x2 grid
 * Used in: full provider profile modal
 */
export function ProviderDifficultyFull({
  generalDifficulty,
  speedDifficulty,
  terminologyDifficulty,
  noteDifficulty,
}: ProviderDifficultyFullProps) {
  // Check if any difficulty metrics are set
  const hasAnyMetrics =
    generalDifficulty ||
    speedDifficulty ||
    terminologyDifficulty ||
    noteDifficulty;

  if (!hasAnyMetrics) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No difficulty metrics set for this provider
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">
      <div className="flex justify-center">
        <DifficultyDial
          value={generalDifficulty}
          label="General Difficulty"
          size="medium"
          showValue={true}
        />
      </div>

      <div className="flex justify-center">
        <DifficultyDial
          value={speedDifficulty}
          label="Speed Expectations"
          size="medium"
          showValue={true}
        />
      </div>

      <div className="flex justify-center">
        <DifficultyDial
          value={terminologyDifficulty}
          label="Terminology Level"
          size="medium"
          showValue={true}
        />
      </div>

      <div className="flex justify-center">
        <DifficultyDial
          value={noteDifficulty}
          label="Note Complexity"
          size="medium"
          showValue={true}
        />
      </div>
    </div>
  );
}
