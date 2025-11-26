'use client';

import { useState } from 'react';
import { Calendar, Lock } from 'lucide-react';

const PASSCODE = '1234'; // TODO: Move to environment variable or secure storage

export default function ScheduleCalendar() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [currentDate] = useState(new Date());

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === PASSCODE) {
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPasscode('');
      // Reset error after animation
      setTimeout(() => setError(false), 500);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date().getDate();
  const currentMonth = new Date().getMonth() === currentDate.getMonth();

  if (!isUnlocked) {
    return (
      <div className="relative">
        {/* Blurred Calendar Preview */}
        <div className="pointer-events-none select-none">
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 backdrop-blur-3xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 blur-sm">
                    {monthName}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 blur-sm">Schedule Overview</p>
                </div>
              </div>
            </div>

            {/* Calendar Grid - Blurred */}
            <div className="blur-md select-none">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
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
                        aspect-square flex items-center justify-center rounded-lg text-sm font-medium
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

        {/* Passcode Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl rounded-2xl">
          <div className="w-full max-w-xs p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4">
                <Lock className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                Enter Passcode
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Protected content requires authentication
              </p>
            </div>

            <form onSubmit={handlePasscodeSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="••••"
                  maxLength={4}
                  className={`
                    w-full px-4 py-3 text-center text-2xl tracking-widest font-medium
                    bg-zinc-100 dark:bg-zinc-800 border-2 rounded-xl
                    text-zinc-900 dark:text-zinc-100
                    placeholder:text-zinc-400 dark:placeholder:text-zinc-600
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all
                    ${error ? 'border-red-500 animate-shake' : 'border-zinc-200 dark:border-zinc-700'}
                  `}
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2 text-center">
                    Incorrect passcode. Please try again.
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Unlock
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Unlocked Calendar View
  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {monthName}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Your schedule at a glance</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsUnlocked(false);
            setPasscode('');
          }}
          className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          title="Lock calendar"
        >
          <Lock className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
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
                  aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium
                  transition-all hover:scale-105 relative
                  ${
                    isToday
                      ? 'bg-blue-600 text-white shadow-lg'
                      : hasSchedule
                        ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                        : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                  }
                `}
              >
                {day}
                {hasSchedule && !isToday && (
                  <div className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule Info */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">Today's Schedule:</span> Click on any date to view or add schedule details
        </p>
      </div>
    </div>
  );
}
