'use client';

import { useState, useMemo, memo } from 'react';
import { Calendar, Lock } from 'lucide-react';

const PASSCODE = '5150'; // TODO: Move to environment variable or secure storage

function ScheduleCalendar() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [currentDate] = useState(new Date());

  const handlePasscodeChange = (value: string) => {
    setPasscode(value);

    // Auto-unlock when correct passcode is entered
    if (value === PASSCODE) {
      setIsUnlocked(true);
      setError(false);
    } else if (value.length === 4) {
      // Show error if 4 digits entered but incorrect
      setError(true);
      setPasscode('');
      // Reset error after animation
      setTimeout(() => setError(false), 500);
    }
  };

  // Memoize calendar calculations for performance
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const today = new Date().getDate();
    const currentMonth = new Date().getMonth() === month;

    return { daysInMonth, startingDayOfWeek, monthName, today, currentMonth };
  }, [currentDate]);

  const { daysInMonth, startingDayOfWeek, monthName, today, currentMonth } = calendarData;

  if (!isUnlocked) {
    return (
      <div className="relative max-w-2xl mx-auto">
        {/* Blurred Calendar Preview */}
        <div className="pointer-events-none select-none">
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 backdrop-blur-3xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 blur-sm">
                    {monthName}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 blur-sm">Schedule Overview</p>
                </div>
              </div>
            </div>

            {/* Calendar Grid - Blurred */}
            <div className="blur-md select-none">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={`${day}-${i}`} className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isToday = currentMonth && day === today;
                  return (
                    <div
                      key={day}
                      className={`
                        aspect-square flex items-center justify-center rounded text-xs font-medium
                        ${isToday ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'}
                      `}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Passcode Overlay - Softer blur with gradient edges */}
        <div className="absolute inset-0 flex items-center justify-center rounded-xl overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/95 to-white/90 dark:from-zinc-950/90 dark:via-zinc-950/95 dark:to-zinc-950/90 backdrop-blur-xl"
            style={{
              maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 100%)'
            }}
          />
          <div className="relative w-full max-w-xs p-4">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-3">
                <Lock className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                Scribe/Provider Calendar
              </h3>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Protected content
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => handlePasscodeChange(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  className={`
                    w-full px-4 py-2 text-center text-xl tracking-widest font-medium
                    bg-zinc-100 dark:bg-zinc-800 border-2 rounded-lg
                    text-zinc-900 dark:text-zinc-100
                    placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all
                    ${error ? 'border-red-500 animate-shake' : 'border-zinc-200 dark:border-zinc-700'}
                  `}
                />
                {error && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 text-center">
                    Incorrect passcode
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Unlocked Calendar View
  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {monthName}
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">Your schedule at a glance</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-1">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={`${day}-${i}`} className="text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = currentMonth && day === today;
            // Mock data - in production, this would come from your scheduling system
            const hasSchedule = day % 3 === 0; // Example: every 3rd day has a schedule

            return (
              <button
                key={day}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded text-xs font-medium
                  transition-all hover:scale-105 relative
                  ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-md'
                      : hasSchedule
                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }
                `}
              >
                {day}
                {hasSchedule && !isToday && (
                  <div className="w-0.5 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule Info */}
      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Today's Schedule:</span> Click any date to view details
        </p>
      </div>
    </div>
  );
}

// Export memoized component for performance
export default memo(ScheduleCalendar);
