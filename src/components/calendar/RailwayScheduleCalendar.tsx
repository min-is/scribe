'use client';

import { useState, useMemo, memo, useEffect } from 'react';
import { Calendar, Lock, X } from 'lucide-react';
import { getZoneStyles, formatShiftTime, getZoneGroupLabel, type ZoneGroup } from '@/lib/shiftgen';

const PASSCODE = '5150'; // TODO: Move to environment variable or secure storage

// Railway shift type (simplified from database)
interface RailwayShift {
  id: string;
  date: string;
  shift_label: string;
  shift_time: string;
  scribe_name: string | null;
  provider_name: string | null;
  zone: string;
}

interface ShiftCardProps {
  shift: RailwayShift;
}

function ShiftCard({ shift }: ShiftCardProps) {
  const zoneStyles = getZoneStyles(shift.zone);

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
            {shift.shift_label}
          </span>
          <span className="text-xs text-zinc-600 dark:text-zinc-400">{shift.shift_time}</span>
        </div>
      </div>
      <div className="mt-1">
        {shift.scribe_name && (
          <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {shift.scribe_name}
            {shift.provider_name && (
              <span className="text-xs text-zinc-600 dark:text-zinc-400 ml-1">
                with {shift.provider_name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface DailySchedule {
  date: string;
  shifts: {
    zone1: RailwayShift[];
    zone2: RailwayShift[];
    zones34: RailwayShift[];
    zones56: RailwayShift[];
    overflowPit: RailwayShift[];
  };
  summary: {
    totalShifts: number;
    uniqueScribes: number;
    uniqueProviders: number;
    zonesCovered: string[];
  };
}

interface DailyModalProps {
  date: Date;
  dailySchedule: DailySchedule | null;
  onClose: () => void;
}

function DailyModal({ date, dailySchedule, onClose }: DailyModalProps) {
  if (!dailySchedule) return null;

  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const shifts = dailySchedule.shifts;
  const hasShifts =
    shifts.zone1?.length > 0 ||
    shifts.zone2?.length > 0 ||
    shifts.zones34?.length > 0 ||
    shifts.zones56?.length > 0 ||
    shifts.overflowPit?.length > 0;

  // Define zone groups with proper typing
  const zoneGroups: { key: ZoneGroup; shifts: RailwayShift[] }[] = [
    { key: 'zone1', shifts: shifts.zone1 || [] },
    { key: 'zone2', shifts: shifts.zone2 || [] },
    { key: 'zones34', shifts: shifts.zones34 || [] },
    { key: 'zones56', shifts: shifts.zones56 || [] },
    { key: 'overflowPit', shifts: shifts.overflowPit || [] },
  ];

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
              {dailySchedule.summary.totalShifts} shift{dailySchedule.summary.totalShifts !== 1 ? 's' : ''}
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
              {/* Iterate over zone groups with proper typing */}
              {zoneGroups.map(({ key, shifts: zoneShifts }) => (
                zoneShifts.length > 0 && (
                  <div key={key}>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2 px-1">
                      {getZoneGroupLabel(key)}
                    </h4>
                    <div className="space-y-2">
                      {zoneShifts.map((shift, idx) => (
                        <ShiftCard key={`${shift.id}-${idx}`} shift={shift} />
                      ))}
                    </div>
                  </div>
                )
              ))}

              {/* Summary */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {dailySchedule.summary.uniqueScribes}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">Scribes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {dailySchedule.summary.uniqueProviders}
                    </div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">Providers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {dailySchedule.summary.zonesCovered.length}
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

function RailwayScheduleCalendar() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [currentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dailySchedule, setDailySchedule] = useState<DailySchedule | null>(null);
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
        if (data.success && data.data) {
          const shiftsByDay = new Map<number, number>();
          data.data.forEach((shift: RailwayShift) => {
            const shiftDate = new Date(shift.date);
            const day = shiftDate.getDate();
            shiftsByDay.set(day, (shiftsByDay.get(day) || 0) + 1);
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
        if (data.success && data.data) {
          setDailySchedule(data.data);
        }
      } catch (error) {
        console.error('Error fetching daily schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDailySchedule();
  }, [selectedDate]);

  const handleDayClick = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = new Date(year, month, day);
    setSelectedDate(date);
  };

  const closeModal = () => {
    setSelectedDate(null);
    setDailySchedule(null);
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
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Scribe/Provider Calendar
              </h3>
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
                    w-32 mx-auto block px-4 py-2 text-center text-xl tracking-widest font-medium
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
    <>
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
              const hasSchedule = monthShifts.has(day);
              const shiftCount = monthShifts.get(day) || 0;

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
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
                    <div className="text-[8px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                      {shiftCount}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Schedule Info */}
        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Shift Calendar:</span> Click any date to view details
          </p>
        </div>
      </div>

      {/* Daily Modal */}
      {selectedDate && (
        <DailyModal
          date={selectedDate}
          dailySchedule={dailySchedule}
          onClose={closeModal}
        />
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              <span className="text-sm text-zinc-900 dark:text-zinc-100">Loading schedule...</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Export memoized component for performance
export default memo(RailwayScheduleCalendar);
