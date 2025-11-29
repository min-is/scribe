/**
 * ShiftGen Database Utilities
 * CRUD operations for shift management
 */

import { prisma } from '@/lib/prisma';
import {
  ShiftWithRelations,
  GroupedShifts,
  DailySchedule,
  CurrentShifts,
  ShiftFilters,
} from './types';
import { getShiftTimePeriod, isShiftActive } from './constants';

/**
 * Get all shifts for a specific date
 */
export async function getShiftsForDate(date: Date): Promise<ShiftWithRelations[]> {
  const shifts = await prisma.shift.findMany({
    where: {
      date: {
        equals: date,
      },
    },
    include: {
      scribe: true,
      provider: true,
    },
    orderBy: [
      { startTime: 'asc' },
      { zone: 'asc' },
    ],
  });

  return shifts;
}

/**
 * Get shifts within a date range with optional filters
 */
export async function getShiftsInRange(
  startDate: Date,
  endDate: Date,
  filters?: ShiftFilters
): Promise<ShiftWithRelations[]> {
  const shifts = await prisma.shift.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      ...(filters?.zone && { zone: filters.zone }),
      ...(filters?.scribeId && { scribeId: filters.scribeId }),
      ...(filters?.providerId && { providerId: filters.providerId }),
      ...(filters?.site && { site: filters.site }),
    },
    include: {
      scribe: true,
      provider: true,
    },
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' },
      { zone: 'asc' },
    ],
  });

  return shifts;
}

/**
 * Get currently active shifts
 */
export async function getCurrentShifts(): Promise<CurrentShifts> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allShiftsToday = await getShiftsForDate(today);

  const activeShifts = allShiftsToday.filter((shift) =>
    isShiftActive(shift.startTime, shift.endTime)
  );

  return {
    active: activeShifts,
    count: activeShifts.length,
    timestamp: new Date(),
  };
}

/**
 * Get daily schedule with time period grouping
 */
export async function getDailySchedule(date: Date): Promise<DailySchedule> {
  const shifts = await getShiftsForDate(date);

  // Group by time period
  const grouped: GroupedShifts = {
    morning: [],
    afternoon: [],
    night: [],
  };

  shifts.forEach((shift) => {
    const period = getShiftTimePeriod(shift.startTime);
    grouped[period].push(shift);
  });

  // Calculate summary
  const uniqueScribes = new Set(
    shifts.filter((s) => s.scribeId).map((s) => s.scribeId)
  ).size;
  const uniqueProviders = new Set(
    shifts.filter((s) => s.providerId).map((s) => s.providerId)
  ).size;
  const zonesCovered = Array.from(new Set(shifts.map((s) => s.zone))).sort();

  return {
    date,
    shifts: grouped,
    summary: {
      totalShifts: shifts.length,
      uniqueScribes,
      uniqueProviders,
      zonesCovered,
    },
  };
}

/**
 * Find scribe by name (case-insensitive)
 */
export async function findScribeByName(name: string) {
  return await prisma.scribe.findFirst({
    where: {
      OR: [
        { name: { equals: name, mode: 'insensitive' } },
        { standardizedName: { equals: name, mode: 'insensitive' } },
      ],
    },
  });
}

/**
 * Find provider by name (fuzzy match)
 */
export async function findProviderByName(name: string) {
  // Try exact match first
  const exact = await prisma.provider.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
    },
  });

  if (exact) return exact;

  // Try partial match
  return await prisma.provider.findFirst({
    where: {
      name: { contains: name, mode: 'insensitive' },
    },
  });
}

/**
 * Create a new shift
 */
export async function createShift(data: {
  date: Date;
  zone: string;
  startTime: string;
  endTime: string;
  site: string;
  scribeId?: string;
  providerId?: string;
}) {
  return await prisma.shift.create({
    data,
    include: {
      scribe: true,
      provider: true,
    },
  });
}

/**
 * Update a shift
 */
export async function updateShift(
  id: string,
  data: Partial<{
    zone: string;
    startTime: string;
    endTime: string;
    site: string;
    scribeId: string | null;
    providerId: string | null;
  }>
) {
  return await prisma.shift.update({
    where: { id },
    data,
    include: {
      scribe: true,
      provider: true,
    },
  });
}

/**
 * Delete a shift
 */
export async function deleteShift(id: string) {
  return await prisma.shift.delete({
    where: { id },
  });
}

/**
 * Delete all shifts for a specific date
 */
export async function deleteShiftsForDate(date: Date) {
  return await prisma.shift.deleteMany({
    where: { date },
  });
}

/**
 * Create or find scribe by name
 */
export async function findOrCreateScribe(name: string, standardizedName?: string) {
  let scribe = await findScribeByName(name);

  if (!scribe) {
    scribe = await prisma.scribe.create({
      data: {
        name,
        standardizedName: standardizedName || name,
      },
    });
  }

  return scribe;
}

/**
 * Get all scribes
 */
export async function getAllScribes() {
  return await prisma.scribe.findMany({
    orderBy: { name: 'asc' },
  });
}

/**
 * Get shifts for a specific scribe
 */
export async function getShiftsByScribe(scribeId: string, startDate?: Date, endDate?: Date) {
  return await prisma.shift.findMany({
    where: {
      scribeId,
      ...(startDate && endDate && {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }),
    },
    include: {
      scribe: true,
      provider: true,
    },
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' },
    ],
  });
}

/**
 * Get shifts for a specific provider
 */
export async function getShiftsByProvider(providerId: string, startDate?: Date, endDate?: Date) {
  return await prisma.shift.findMany({
    where: {
      providerId,
      ...(startDate && endDate && {
        date: {
          gte: startDate,
          lte: endDate,
        },
      }),
    },
    include: {
      scribe: true,
      provider: true,
    },
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' },
    ],
  });
}
