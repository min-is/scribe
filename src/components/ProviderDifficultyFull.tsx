'use client';

import { DifficultyDial } from './DifficultyDial';

interface ProviderDifficultyFullProps {
  generalDifficulty?: number | null;
  speedDifficulty?: number | null;
  terminologyDifficulty?: number | null;
  noteDifficulty?: number | null;
}

/**
 * Shows all 4 difficulty dials in a single row
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
    <div className="flex flex-row flex-wrap justify-center gap-4 py-4">
      <div className="flex justify-center">
        <DifficultyDial
          value={generalDifficulty}
          label="General Difficulty"
          size="small"
          showValue={true}
        />
      </div>

      <div className="flex justify-center">
        <DifficultyDial
          value={speedDifficulty}
          label="Speed Expectations"
          size="small"
          showValue={true}
        />
      </div>

      <div className="flex justify-center">
        <DifficultyDial
          value={terminologyDifficulty}
          label="Terminology Level"
          size="small"
          showValue={true}
        />
      </div>

      <div className="flex justify-center">
        <DifficultyDial
          value={noteDifficulty}
          label="Note Complexity"
          size="small"
          showValue={true}
        />
      </div>
    </div>
  );
}
