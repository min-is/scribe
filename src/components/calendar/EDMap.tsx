'use client';

import { useMemo } from 'react';
import { getZoneStyles } from '@/lib/shiftgen';

interface EDMapProps {
  shifts?: {
    label: string;
    scribe: string;
    provider: string | null;
  }[];
}

// Zone to rooms mapping based on the ED map
const ZONE_ROOMS: Record<string, string[]> = {
  'Zone 1': ['21', '23', '25', '27', '39', '41', '43', '45'],
  'Zone 2': ['77', '78', '79', '15', '11', '09', '07'],
  'Zones 3/4': ['19', '17', '05', '03', '08', '10', '12', '14', '06', '04', '16', '28', '18', '30'],
  'Zones 5/6': ['37', '35', '1A', '2A', '2B', '32', '34'],
  'Overflow/PIT': ['22', '24', '26', '38', '40', '42', '44', '46', '48'],
};

// Scribe sitting positions by zone (approximate coordinates based on map)
const SCRIBE_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  'Zone 1': { x: 65, y: 25, label: 'Near room 25' },
  'Zone 2': { x: 15, y: 30, label: 'Near room 15' },
  'Zones 3/4': { x: 50, y: 60, label: 'Main zone' },
  'Zones 5/6': { x: 85, y: 50, label: 'Near room 22' },
  'Overflow/PIT': { x: 50, y: 85, label: 'Fast track' },
};

export default function EDMap({ shifts = [] }: EDMapProps) {
  // Group shifts by zone and get scribe/provider info
  const zoneData = useMemo(() => {
    const data: Record<string, { scribes: string[]; providers: string[] }> = {};

    shifts.forEach(shift => {
      const config = getZoneStyles(shift.label);
      // Map shift label to zone name
      let zoneName = 'Unknown';
      if (['B', 'F', 'X'].includes(shift.label)) zoneName = 'Zone 1';
      else if (['A', 'E', 'I'].includes(shift.label)) zoneName = 'Zone 2';
      else if (['C', 'G'].includes(shift.label)) zoneName = 'Zones 3/4';
      else if (['D', 'H', 'PA'].includes(shift.label)) zoneName = 'Zones 5/6';
      else if (shift.label === 'PIT') zoneName = 'Overflow/PIT';

      if (!data[zoneName]) {
        data[zoneName] = { scribes: [], providers: [] };
      }

      data[zoneName].scribes.push(shift.scribe);
      if (shift.provider) {
        data[zoneName].providers.push(shift.provider);
      }
    });

    return data;
  }, [shifts]);

  const hasActiveShifts = shifts.length > 0;

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          ED Layout
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {hasActiveShifts ? 'Zone assignments and staff locations' : 'Interactive zone map'}
        </p>
      </div>

      {/* SVG Map - Simplified minimalistic version */}
      <div className="relative w-full aspect-[4/3] bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Zone 2 - Left side (rooms 77, 78, 79, 15, 11, 09, 07) */}
          <rect
            x="5"
            y="20"
            width="20"
            height="40"
            className={`transition-all ${
              zoneData['Zone 2']
                ? 'fill-red-500/20 stroke-red-500'
                : 'fill-zinc-100 dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600'
            }`}
            strokeWidth="0.5"
          />
          <text
            x="15"
            y="40"
            className="text-[3px] fill-zinc-700 dark:fill-zinc-300 font-semibold"
            textAnchor="middle"
          >
            Zone 2
          </text>

          {/* Zone 1 - Top center (rooms 21, 23, 25, 27, 39, 41, 43, 45) */}
          <rect
            x="35"
            y="5"
            width="40"
            height="20"
            className={`transition-all ${
              zoneData['Zone 1']
                ? 'fill-blue-500/20 stroke-blue-500'
                : 'fill-zinc-100 dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600'
            }`}
            strokeWidth="0.5"
          />
          <text
            x="55"
            y="15"
            className="text-[3px] fill-zinc-700 dark:fill-zinc-300 font-semibold"
            textAnchor="middle"
          >
            Zone 1
          </text>

          {/* Zones 3/4 - Center (rooms 19, 17, 05, 03, 08, 10, 12, 14, 06, 04, 16, 28, 18, 30) */}
          <rect
            x="35"
            y="30"
            width="35"
            height="40"
            className={`transition-all ${
              zoneData['Zones 3/4']
                ? 'fill-amber-500/20 stroke-amber-500'
                : 'fill-zinc-100 dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600'
            }`}
            strokeWidth="0.5"
          />
          <text
            x="52"
            y="50"
            className="text-[3px] fill-zinc-700 dark:fill-zinc-300 font-semibold"
            textAnchor="middle"
          >
            Zones 3/4
          </text>

          {/* Main Zone label in center */}
          <rect
            x="40"
            y="55"
            width="20"
            height="8"
            className="fill-zinc-200 dark:fill-zinc-700 stroke-zinc-400 dark:stroke-zinc-500"
            strokeWidth="0.3"
            rx="1"
          />
          <text
            x="50"
            y="60"
            className="text-[2.5px] fill-zinc-600 dark:fill-zinc-400"
            textAnchor="middle"
          >
            Main Zone
          </text>

          {/* Zones 5/6 - Right side (rooms 37, 35, 1A, 2A, 2B, 32, 34) */}
          <rect
            x="75"
            y="30"
            width="20"
            height="40"
            className={`transition-all ${
              zoneData['Zones 5/6']
                ? 'fill-emerald-500/20 stroke-emerald-500'
                : 'fill-zinc-100 dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600'
            }`}
            strokeWidth="0.5"
          />
          <text
            x="85"
            y="50"
            className="text-[3px] fill-zinc-700 dark:fill-zinc-300 font-semibold"
            textAnchor="middle"
          >
            Zone 5/6
          </text>

          {/* Overflow/PIT - Bottom (fast track area) */}
          <rect
            x="15"
            y="75"
            width="70"
            height="15"
            className={`transition-all ${
              zoneData['Overflow/PIT']
                ? 'fill-purple-500/20 stroke-purple-500'
                : 'fill-zinc-100 dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600'
            }`}
            strokeWidth="0.5"
          />
          <text
            x="50"
            y="83"
            className="text-[3px] fill-zinc-700 dark:fill-zinc-300 font-semibold"
            textAnchor="middle"
          >
            Fast Track / PIT
          </text>

          {/* Staff markers - only show when there are active shifts */}
          {hasActiveShifts && Object.entries(zoneData).map(([zone, data]) => {
            const pos = SCRIBE_POSITIONS[zone];
            if (!pos || data.scribes.length === 0) return null;

            return (
              <g key={zone}>
                {/* Marker circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="2"
                  className="fill-zinc-900 dark:fill-zinc-100 stroke-white dark:stroke-zinc-900"
                  strokeWidth="0.5"
                />
                {/* Scribe count badge */}
                <circle
                  cx={pos.x + 2}
                  cy={pos.y - 2}
                  r="1.5"
                  className="fill-blue-600 dark:fill-blue-500"
                />
                <text
                  x={pos.x + 2}
                  y={pos.y - 1.3}
                  className="text-[2px] fill-white font-bold"
                  textAnchor="middle"
                >
                  {data.scribes.length}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend / Staff List */}
      {hasActiveShifts && (
        <div className="mt-4 space-y-2">
          <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Staff Assignments
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
            {Object.entries(zoneData).map(([zone, data]) => {
              if (data.scribes.length === 0) return null;

              const zoneColor =
                zone === 'Zone 1' ? 'blue' :
                zone === 'Zone 2' ? 'red' :
                zone === 'Zones 3/4' ? 'amber' :
                zone === 'Zones 5/6' ? 'emerald' :
                'purple';

              return (
                <div
                  key={zone}
                  className={`p-2 rounded-lg border bg-${zoneColor}-500/5 border-${zoneColor}-500/20`}
                >
                  <div className={`text-xs font-semibold text-${zoneColor}-700 dark:text-${zoneColor}-300 mb-1`}>
                    {zone}
                  </div>
                  <div className="text-xs text-zinc-700 dark:text-zinc-300">
                    <div>Scribes: {data.scribes.join(', ')}</div>
                    {data.providers.length > 0 && (
                      <div className="mt-0.5">Providers: {data.providers.join(', ')}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Helper text when no shifts */}
      {!hasActiveShifts && (
        <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Select a date in the calendar to view staff assignments and zone locations
          </p>
        </div>
      )}
    </div>
  );
}
