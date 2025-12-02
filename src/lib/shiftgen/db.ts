/**
 * ShiftGen Database Utilities
 * CRUD operations for shift management
 */

import { prisma } from '@/lib/prisma';
import {
  ShiftWithRelations,
  GroupedShifts,
  ZoneGroupedShifts,
  DailySchedule,
  CurrentShifts,
  ShiftFilters,
} from './types';
import { getShiftTimePeriod, isShiftActive, getZoneGroupForShift, getShiftOrderInZone } from './constants';

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
 * Get daily schedule with time period grouping (deprecated - use getDailyScheduleByZone)
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
 * Get daily schedule with zone-based grouping
 */
export async function getDailyScheduleByZone(date: Date): Promise<DailySchedule> {
  const shifts = await getShiftsForDate(date);

  // Group by zone
  const grouped: ZoneGroupedShifts = {
    zone1: [],
    zone2: [],
    zones34: [],
    zones56: [],
    overflowPit: [],
  };

  shifts.forEach((shift) => {
    const zoneGroup = getZoneGroupForShift(shift.zone);
    grouped[zoneGroup].push(shift);
  });

  // Sort shifts within each zone group by shift order and start time
  Object.keys(grouped).forEach((key) => {
    const zoneKey = key as keyof ZoneGroupedShifts;
    grouped[zoneKey].sort((a, b) => {
      const orderDiff = getShiftOrderInZone(a.zone) - getShiftOrderInZone(b.zone);
      if (orderDiff !== 0) return orderDiff;
      return a.startTime.localeCompare(b.startTime);
    });
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
 * Generate a URL-friendly slug from a provider name
 */
function generateProviderSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Create or find provider by name
 */
export async function findOrCreateProvider(name: string) {
  let provider = await findProviderByName(name);

  if (!provider) {
    const baseSlug = generateProviderSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Ensure slug uniqueness by appending a counter if needed
    while (await prisma.provider.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    provider = await prisma.provider.create({
      data: {
        name,
        slug,
      },
    });
  }

  return provider;
}

/**
 * Upsert shift (create or update)
 */
export async function upsertShift(data: {
  date: Date;
  zone: string;
  startTime: string;
  endTime: string;
  site: string;
  scribeId?: string | null;
  providerId?: string | null;
}): Promise<{ created: boolean; updated: boolean; shift: ShiftWithRelations }> {
  // Try to find existing shift by date, zone, and startTime only
  // This allows us to update a shift with provider info even if it was created with just scribe info
  const existing = await prisma.shift.findFirst({
    where: {
      date: data.date,
      zone: data.zone,
      startTime: data.startTime,
      scribeId: data.scribeId || null,
    },
  });

  if (existing) {
    // Update existing shift (including provider if provided)
    const updated = await prisma.shift.update({
      where: { id: existing.id },
      data: {
        endTime: data.endTime,
        site: data.site,
        scribeId: data.scribeId,
        providerId: data.providerId,
      },
      include: {
        scribe: true,
        provider: true,
      },
    });

    return {
      created: false,
      updated: true,
      shift: updated,
    };
  } else {
    // Create new shift
    const created = await prisma.shift.create({
      data,
      include: {
        scribe: true,
        provider: true,
      },
    });

    return {
      created: true,
      updated: false,
      shift: created,
    };
  }
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

/**
 * Clean duplicate shifts from database
 * Removes shifts with identical date, zone, startTime, scribeId, and providerId
 */
export async function cleanDuplicateShifts(): Promise<{ deleted: number }> {
  const allShifts = await prisma.shift.findMany({
    orderBy: [
      { date: 'asc' },
      { zone: 'asc' },
      { startTime: 'asc' },
      { createdAt: 'asc' }, // Keep the oldest one
    ],
  });

  const seen = new Set<string>();
  const duplicateIds: string[] = [];

  for (const shift of allShifts) {
    const key = `${shift.date.toISOString()}-${shift.zone}-${shift.startTime}-${shift.scribeId || 'null'}-${shift.providerId || 'null'}`;

    if (seen.has(key)) {
      duplicateIds.push(shift.id);
    } else {
      seen.add(key);
    }
  }

  if (duplicateIds.length > 0) {
    await prisma.shift.deleteMany({
      where: {
        id: {
          in: duplicateIds,
        },
      },
    });
  }

  return { deleted: duplicateIds.length };
}

/**
 * Reset database - delete all shifts (careful!)
 */
export async function resetDatabase(): Promise<{ deletedShifts: number }> {
  const result = await prisma.shift.deleteMany({});
  return { deletedShifts: result.count };
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  const [totalShifts, totalScribes, totalProviders, oldestShift, newestShift] = await Promise.all([
    prisma.shift.count(),
    prisma.scribe.count(),
    prisma.provider.count(),
    prisma.shift.findFirst({
      orderBy: { date: 'asc' },
      select: { date: true },
    }),
    prisma.shift.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true },
    }),
  ]);

  return {
    totalShifts,
    totalScribes,
    totalProviders,
    oldestShiftDate: oldestShift?.date || null,
    newestShiftDate: newestShift?.date || null,
  };
}
