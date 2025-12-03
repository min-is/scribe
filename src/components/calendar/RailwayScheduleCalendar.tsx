'use client';

import { useState, useEffect } from 'react';
import { Calendar, Lock, X } from 'lucide-react';
import { getZoneStyles, formatShiftTime, getZoneGroupLabel } from '@/lib/shiftgen';

const PASSCODE = '5150'; // TODO: Move to environment variable or secure storage

interface RailwayShiftData {
  label: string;
  time: string;
  scribe: string;
  provider: string | null;
  providerRole: string | null;
}

interface RailwayZoneGroups {
  [zoneGroup: string]: RailwayShiftData[];
}

interface RailwayDailyData {
  success: boolean;
  date: string;
  zones: RailwayZoneGroups;
}

interface ShiftCardProps {
  shift: RailwayShiftData;
  zoneGroup: string;
}

function ShiftCard({ shift, zoneGroup }: ShiftCardProps) {
  const zoneStyles = getZoneStyles(shift.label);
  const [startTime, endTime] = shift.time.split('-');
  const timeStr = formatShiftTime(startTime, endTime);

  return (
    <div
      className={`
        px-3 py-2 rounded-md transition-colors
        ${zoneStyles.border} ${zoneStyles.bg}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${zoneStyles.badge} px-2 py-0.5 rounded`}>
            {shift.label}
          </span>
          <span className="text-xs text-zinc-600 dark:text-zinc-400">{timeStr}</span>
        </div>
      </div>
      <div className="mt-1">
        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {shift.scribe}
          {shift.provider && (
            <span className="text-xs text-zinc-600 dark:text-zinc-400 ml-1">
              with {shift.provider}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface DailyModalProps {
  date: Date;
  dailyData: RailwayDailyData | null;
  onClose: () => void;
}

function DailyModal({ date, dailyData, onClose }: DailyModalProps) {
  if (!dailyData || !dailyData.zones) return null;

  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const zoneEntries = Object.entries(dailyData.zones);
  const totalShifts = zoneEntries.reduce((sum, [_, shifts]) => sum + shifts.length, 0);
  const hasShifts = totalShifts > 0;

  // Count unique scribes and providers
  const allShifts = zoneEntries.flatMap(([_, shifts]) => shifts);
  const uniqueScribes = new Set(allShifts.map(s => s.scribe)).size;
  const uniqueProviders = new Set(
    allShifts.map(s => s.provider).filter(Boolean)
  ).size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {dateStr}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {totalShifts} shift{totalShifts !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {!hasShifts ? (
            <div className="text-center py-12">
              <p className="text-zinc-600 dark:text-zinc-400">No shifts scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-4">
              {zoneEntries.map(([zoneGroup, shifts]) => (
                <div key={zoneGroup}>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2 px-1">
                    {getZoneGroupLabel(zoneGroup)}
                  </h4>
                  <div className="space-y-2">
                    {shifts.map((shift, idx) => (
                      <ShiftCard
                        key={`${shift.label}-${shift.time}-${idx}`}
                        shift={shift}
                        zoneGroup={zoneGroup}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {uniqueScribes}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">Scribes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {uniqueProviders}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">Providers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {zoneEntries.length}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">Zones</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RailwayScheduleCalendar() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [currentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dailyData, setDailyData] = useState<RailwayDailyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [monthShifts, setMonthShifts] = useState<Map<number, number>>(new Map());

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

  // Fetch month shifts when unlocked
  useEffect(() => {
    if (!isUnlocked) return;

    const fetchMonthShifts = async () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      try {
        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];

        const response = await fetch(
          `/api/railway-shifts/range?startDate=${startDate}&endDate=${endDate}`
        );

        if (!response.ok) {
          console.error('Failed to fetch month shifts');
          return;
        }

        const data = await response.json();
        if (data.success && data.shifts) {
          const shiftsByDay = new Map<number, number>();
          Object.entries(data.shifts).forEach(([dateStr, shifts]: [string, any]) => {
            const shiftDate = new Date(dateStr);
            const day = shiftDate.getDate();
            shiftsByDay.set(day, shifts.length);
          });
          setMonthShifts(shiftsByDay);
        }
      } catch (error) {
        console.error('Error fetching month shifts:', error);
      }
    };

    fetchMonthShifts();
  }, [isUnlocked, currentDate]);

  // Fetch daily schedule when date is selected
  useEffect(() => {
    if (!selectedDate) return;

    const fetchDailySchedule = async () => {
      setLoading(true);
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const response = await fetch(`/api/railway-shifts/daily?date=${dateStr}`);

        if (!response.ok) {
          console.error('Failed to fetch daily schedule');
          return;
        }

        const data = await response.json();
        if (data.success) {
          setDailyData(data);
        }
      } catch (error) {
        console.error('Error fetching daily schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDailySchedule();
  }, [selectedDate]);

  // Generate calendar days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
    setDailyData(null);
  };

  // Unlock screen
  if (!isUnlocked) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800 rounded-2xl mb-6">
              <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Schedule Calendar
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              Enter 4-digit passcode to view schedules
            </p>

            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`
                    w-4 h-4 rounded-full border-2 transition-all duration-200
                    ${
                      index < passcode.length
                        ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                        : 'border-zinc-300 dark:border-zinc-700'
                    }
                    ${error ? 'animate-shake border-red-500' : ''}
                  `}
                />
              ))}
            </div>

            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={passcode}
              onChange={(e) => handlePasscodeChange(e.target.value.replace(/\D/g, ''))}
              className="sr-only"
              autoFocus
              aria-label="Enter passcode"
            />

            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, ''].map((num, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (num === '') return;
                    if (passcode.length < 4) {
                      handlePasscodeChange(passcode + num);
                    }
                  }}
                  disabled={num === ''}
                  className={`
                    h-14 rounded-lg text-lg font-semibold transition-all
                    ${
                      num === ''
                        ? 'invisible'
                        : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100'
                    }
                  `}
                >
                  {num}
                </button>
              ))}
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                Incorrect passcode. Please try again.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Calendar view
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800 rounded-xl">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{monthName}</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Railway Database
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {emptyDays.map((i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Actual days */}
            {days.map((day) => {
              const hasShifts = monthShifts.has(day);
              const shiftCount = monthShifts.get(day) || 0;
              const isToday =
                day === new Date().getDate() &&
                month === new Date().getMonth() &&
                year === new Date().getFullYear();

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`
                    aspect-square rounded-lg transition-all relative
                    ${
                      isToday
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-500 dark:border-blue-500'
                        : 'bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700'
                    }
                    ${hasShifts ? 'hover:bg-zinc-100 dark:hover:bg-zinc-800' : ''}
                    ${!hasShifts ? 'opacity-50' : ''}
                  `}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span
                      className={`text-sm font-semibold ${
                        isToday
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {day}
                    </span>
                    {hasShifts && (
                      <span className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                        {shiftCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedDate && <DailyModal date={selectedDate} dailyData={dailyData} onClose={handleCloseModal} />}
    </div>
  );
}
