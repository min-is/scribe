'use client';

import { useEffect, useState } from 'react';

interface DifficultyDialProps {
  value?: number | null; // 1-10 scale
  label?: string;
  size?: 'small' | 'medium' | 'large';
  showValue?: boolean;
}

export function DifficultyDial({
  value,
  label,
  size = 'medium',
  showValue = true,
}: DifficultyDialProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  // Size configurations
  const sizeConfig = {
    small: { width: 80, height: 50, strokeWidth: 8, fontSize: 16 },
    medium: { width: 120, height: 75, strokeWidth: 12, fontSize: 20 },
    large: { width: 160, height: 100, strokeWidth: 16, fontSize: 24 },
  };

  const config = sizeConfig[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle
  const centerX = config.width / 2;
  const centerY = config.height - 10;

  // Animate value on mount/change
  useEffect(() => {
    if (value) {
      const timer = setTimeout(() => setAnimatedValue(value), 50);
      return () => clearTimeout(timer);
    } else {
      setAnimatedValue(0);
    }
  }, [value]);

  // Calculate color based on value
  const getColor = (val: number): string => {
    if (val <= 3) return '#10b981'; // Green
    if (val <= 7) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  // Calculate stroke offset for the progress arc
  const progress = value ? (animatedValue / 10) * circumference : 0;
  const strokeDashoffset = circumference - progress;

  const color = value ? getColor(value) : '#6b7280'; // Gray if no value

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={`M ${config.strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${centerY}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Progress arc */}
        <path
          d={`M ${config.strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${config.width - config.strokeWidth / 2} ${centerY}`}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out"
        />

        {/* Value text */}
        {showValue && value && (
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            fontSize={config.fontSize}
            fontWeight="600"
            fill="currentColor"
            className="text-gray-900 dark:text-gray-100"
          >
            {value}
          </text>
        )}

        {/* Empty state */}
        {showValue && !value && (
          <text
            x={centerX}
            y={centerY - 5}
            textAnchor="middle"
            fontSize={config.fontSize - 4}
            fill="currentColor"
            className="text-gray-400 dark:text-gray-600"
          >
            —
          </text>
        )}
      </svg>

      {/* Label */}
      {label && (
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400 text-center">
          {label}
        </div>
      )}
    </div>
  );
}
