'use client';

import { DifficultyDial } from './DifficultyDial';

interface DifficultyDialInputProps {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
  helperText?: string;
}

export function DifficultyDialInput({
  label,
  value,
  onChange,
  helperText,
}: DifficultyDialInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(undefined);
      return;
    }

    const numValue = parseInt(val, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 10) {
      onChange(numValue);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
          <input
            type="number"
            min="1"
            max="10"
            step="1"
            value={value ?? ''}
            onChange={handleChange}
            placeholder="1-10"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
          />
          {helperText && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {helperText}
            </p>
          )}
        </div>

        {/* Live preview dial */}
        <div className="flex-shrink-0 pt-1">
          <DifficultyDial value={value} size="small" showValue={true} />
        </div>
      </div>
    </div>
  );
}
