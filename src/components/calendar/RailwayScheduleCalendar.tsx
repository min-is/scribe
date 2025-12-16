'use client';

import { useState, useEffect } from 'react';
import { Calendar, Lock, X } from 'lucide-react';
import { getZoneStyles, formatShiftTime, getZoneGroupLabel, type ZoneGroup } from '@/lib/shiftgen';
import EDMap from './EDMap';

// Use environment variable for passcode, fallback to default for development
const PASSCODE = process.env.NEXT_PUBLIC_SCHEDULE_PASSCODE || '5150';

interface RailwayShiftData {
  label: string;
  time: string;
  scribe: string;
  provider: string | null;
  providerRole: string | null;
}

type RailwayZoneGroups = {
  [K in ZoneGroup]?: RailwayShiftData[];
};

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
  const [activeTab, setActiveTab] = useState<'shifts' | 'map'>('shifts');

  const dateStr = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Define zone groups in order for display
  const zoneGroups: ZoneGroup[] = ['zone1', 'zone2', 'zones34', 'zones56', 'overflowPit'];

  // Filter to only zones with shifts (handle case when dailyData is null)
  const zonesWithShifts = dailyData?.zones
    ? zoneGroups
        .map(zoneGroup => ({
          group: zoneGroup,
          shifts: dailyData.zones[zoneGroup] || []
        }))
        .filter(({ shifts }) => shifts.length > 0)
    : [];

  const totalShifts = zonesWithShifts.reduce((sum, { shifts }) => sum + shifts.length, 0);
  const hasShifts = totalShifts > 0;

  // Count unique scribes and providers
  const allShifts = zonesWithShifts.flatMap(({ shifts }) => shifts);
  const uniqueScribes = new Set(allShifts.map(s => s.scribe)).size;
  const uniqueProviders = new Set(
    allShifts.map(s => s.provider).filter(Boolean)
  ).size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between p-4">
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
              aria-label="Close"
            >
              <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 px-4 pb-2">
            <button
              onClick={() => setActiveTab('shifts')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'shifts'
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              Shifts
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'map'
                  ? 'bg-blue-500 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
            >
              ED Map
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-160px)]">
          {activeTab === 'shifts' ? (
            !hasShifts ? (
              <div className="text-center py-12">
                <p className="text-zinc-600 dark:text-zinc-400">No shifts scheduled for this day</p>
              </div>
            ) : (
              <div className="space-y-4">
                {zonesWithShifts.map(({ group, shifts }) => (
                  <div key={group}>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2 px-1">
                      {getZoneGroupLabel(group)}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {shifts.map((shift, idx) => (
                        <ShiftCard
                          key={`${shift.label}-${shift.time}-${idx}`}
                          shift={shift}
                          zoneGroup={group}
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
                        {zonesWithShifts.length}
                      </div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">Zones</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <EDMap dailyData={dailyData} />
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

  // Generate calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date().getDate();
  const currentMonth = new Date().getMonth() === month;

  // Helper arrays for rendering calendar
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: startingDayOfWeek }, (_, i) => i);

  // Fetch month shifts when unlocked
  useEffect(() => {
    if (!isUnlocked) return;

    const fetchMonthShifts = async () => {
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
  }, [isUnlocked, currentDate, firstDay, lastDay]);

  // Fetch daily schedule when date is selected
  useEffect(() => {
    if (!selectedDate) return;

    const fetchDailySchedule = async () => {
      setLoading(true);
      setDailyData(null); // Reset data when fetching new date
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const response = await fetch(`/api/railway-shifts/daily?date=${dateStr}`);

        if (!response.ok) {
          console.error('Failed to fetch daily schedule');
          // Set empty data object to show modal with "no shifts" message
          setDailyData({ success: false, date: dateStr, zones: {} });
          return;
        }

        const data = await response.json();
        setDailyData(data);
      } catch (error) {
        console.error('Error fetching daily schedule:', error);
        // Set empty data object to show modal with error message
        const dateStr = selectedDate.toISOString().split('T')[0];
        setDailyData({ success: false, date: dateStr, zones: {} });
      } finally {
        setLoading(false);
      }
    };

    fetchDailySchedule();
  }, [selectedDate]);

  const handleDayClick = (day: number) => {
    const date = new Date(year, month, day);
    setSelectedDate(date);
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
    setDailyData(null);
  };

  // Unlock screen with blurred preview
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
              <div className="grid grid-cols-7 gap-x-1 gap-y-3 justify-items-center">
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-12 h-12" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isToday = currentMonth && day === today;
                  return (
                    <div
                      key={day}
                      className={`
                        w-12 h-12 flex items-center justify-center rounded-full text-sm font-semibold
                        ${isToday
                          ? 'bg-transparent text-white border-2 border-blue-500'
                          : 'bg-black/90 dark:bg-black text-white'
                        }
                      `}
                      style={isToday ? {
                        boxShadow: '0 0 15px rgba(59, 130, 246, 0.6), 0 0 25px rgba(147, 51, 234, 0.4)',
                      } : undefined}
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
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Scribe/Provider schedules at a glance</p>
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
          <div className="grid grid-cols-7 gap-x-1 gap-y-3 justify-items-center">
            {emptyDays.map((i) => (
              <div key={`empty-${i}`} className="w-12 h-12" />
            ))}
            {days.map((day) => {
              const isToday = currentMonth && day === today;
              const hasSchedule = monthShifts.has(day);

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`
                    w-12 h-12 flex items-center justify-center rounded-full text-sm font-semibold
                    transition-all hover:scale-105
                    ${isToday
                      ? 'bg-transparent text-white border-2 border-blue-500'
                      : 'bg-black/90 dark:bg-black text-white hover:bg-black dark:hover:bg-zinc-900'
                    }
                  `}
                  style={isToday ? {
                    boxShadow: '0 0 15px rgba(59, 130, 246, 0.6), 0 0 25px rgba(147, 51, 234, 0.4)',
                  } : undefined}
                >
                  {day}
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

      {/* Daily Modal - Only show when we have data (loading complete) */}
      {selectedDate && !loading && dailyData && (
        <DailyModal
          date={selectedDate}
          dailyData={dailyData}
          onClose={handleCloseModal}
        />
      )}

      {/* Loading overlay - Show while fetching data */}
      {selectedDate && loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 shadow-xl">
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
