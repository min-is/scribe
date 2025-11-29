/**
 * ShiftGen Database Utilities
 *
 * CRUD operations, querying, and data sync logic for shifts and scribes.
 */

import { prisma } from '@/lib/prisma';
import {
  ShiftWithRelations,
  GroupedShifts,
  DailySchedule,
  CurrentShifts,
  ScraperShiftData,
  SyncSummary,
  ShiftChange,
  ShiftQueryParams,
} from './types';
import { getTimePeriod, isShiftActive, parseShiftTime } from './constants';

/**
 * Get shifts for a specific date
 */
export async function getShiftsForDate(date: Date): Promise<ShiftWithRelations[]> {
  const shifts = await prisma.shift.findMany({
    where: {
      date: new Date(date.toISOString().split('T')[0]),
    },
    include: {
      scribe: true,
      provider: true,
    },
    orderBy: [
      { zone: 'asc' },
      { startTime: 'asc' },
    ],
  });

  return shifts;
}

/**
 * Get shifts within a date range
 */
export async function getShiftsInRange(
  startDate: Date,
  endDate: Date,
  filters?: Omit<ShiftQueryParams, 'date' | 'startDate' | 'endDate'>
): Promise<ShiftWithRelations[]> {
  const where: any = {
    date: {
      gte: new Date(startDate.toISOString().split('T')[0]),
      lte: new Date(endDate.toISOString().split('T')[0]),
    },
  };

  if (filters?.zone) where.zone = filters.zone;
  if (filters?.scribeId) where.scribeId = filters.scribeId;
  if (filters?.providerId) where.providerId = filters.providerId;
  if (filters?.site) where.site = filters.site;

  const shifts = await prisma.shift.findMany({
    where,
    include: {
      scribe: true,
      provider: true,
    },
    orderBy: [
      { date: 'asc' },
      { zone: 'asc' },
      { startTime: 'asc' },
    ],
  });

  return shifts;
}

/**
 * Get currently active shifts
 */
export async function getCurrentShifts(): Promise<CurrentShifts> {
  const now = new Date();
  const today = new Date(now.toISOString().split('T')[0]);

  const allShifts = await getShiftsForDate(today);

  const activeShifts = allShifts.filter(shift =>
    isShiftActive(shift.date, shift.startTime, shift.endTime)
  );

  return {
    timestamp: now,
    activeShifts,
    count: activeShifts.length,
  };
}

/**
 * Get daily schedule with grouped shifts and summary
 */
export async function getDailySchedule(date: Date): Promise<DailySchedule> {
  const shifts = await getShiftsForDate(date);

  // Group shifts by time period
  const grouped: GroupedShifts = {
    morning: [],
    afternoon: [],
    night: [],
  };

  shifts.forEach(shift => {
    const { start } = parseShiftTime(`${shift.startTime}-${shift.endTime}`);
    const period = getTimePeriod(start);
    grouped[period].push(shift);
  });

  // Calculate summary statistics
  const uniqueScribes = new Set(shifts.filter(s => s.scribeId).map(s => s.scribeId));
  const uniqueProviders = new Set(shifts.filter(s => s.providerId).map(s => s.providerId));
  const uniqueZones = new Set(shifts.map(s => s.zone));

  return {
    date,
    shifts,
    grouped,
    summary: {
      totalShifts: shifts.length,
      scribesWorking: uniqueScribes.size,
      providersWorking: uniqueProviders.size,
      zones: Array.from(uniqueZones),
    },
  };
}

/**
 * Find or create a scribe by name
 *
 * Uses fuzzy matching to find existing scribes with similar names.
 */
export async function findOrCreateScribe(name: string): Promise<{ id: string; name: string }> {
  // Try exact match first
  let scribe = await prisma.scribe.findUnique({
    where: { name },
  });

  if (scribe) return scribe;

  // Try standardized name match
  scribe = await prisma.scribe.findFirst({
    where: {
      standardizedName: standardizeName(name),
    },
  });

  if (scribe) return scribe;

  // Create new scribe
  scribe = await prisma.scribe.create({
    data: {
      name,
      standardizedName: standardizeName(name),
    },
  });

  return scribe;
}

/**
 * Find provider by name with fuzzy matching
 */
export async function findProviderByName(name: string): Promise<{ id: string; name: string } | null> {
  // Try exact match
  let provider = await prisma.provider.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
  });

  if (provider) return provider;

  // Try partial match
  provider = await prisma.provider.findFirst({
    where: {
      name: {
        contains: name,
        mode: 'insensitive',
      },
    },
  });

  return provider;
}

/**
 * Standardize name for fuzzy matching
 *
 * Removes titles, credentials, and normalizes whitespace.
 */
function standardizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(dr\.?|md|do|pa|np)\b/gi, '')
    .replace(/[.,]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Upsert a shift (create or update)
 *
 * Uses unique constraint to prevent duplicates.
 */
export async function upsertShift(data: {
  date: Date;
  zone: string;
  startTime: string;
  endTime: string;
  site: string;
  scribeId?: string | null;
  providerId?: string | null;
}): Promise<ShiftWithRelations> {
  const shift = await prisma.shift.upsert({
    where: {
      date_zone_startTime_scribeId_providerId: {
        date: new Date(data.date.toISOString().split('T')[0]),
        zone: data.zone,
        startTime: data.startTime,
        scribeId: data.scribeId || null,
        providerId: data.providerId || null,
      },
    },
    update: {
      endTime: data.endTime,
      site: data.site,
    },
    create: {
      date: new Date(data.date.toISOString().split('T')[0]),
      zone: data.zone,
      startTime: data.startTime,
      endTime: data.endTime,
      site: data.site,
      scribeId: data.scribeId || null,
      providerId: data.providerId || null,
    },
    include: {
      scribe: true,
      provider: true,
    },
  });

  return shift;
}

/**
 * Sync shifts from scraper data (Python bot)
 *
 * Handles batch import, fuzzy name matching, and change detection.
 */
export async function syncShiftsFromScraper(
  shifts: ScraperShiftData[]
): Promise<SyncSummary> {
  const summary: SyncSummary = {
    success: true,
    timestamp: new Date(),
    stats: {
      total: shifts.length,
      created: 0,
      updated: 0,
      unchanged: 0,
      errors: 0,
    },
    changes: [],
    errors: [],
  };

  for (const shiftData of shifts) {
    try {
      // Parse date and time
      const date = new Date(shiftData.date);
      const [startTime, endTime] = shiftData.time.split('-');

      // Map zone (label -> zone)
      const zone = shiftData.label;

      // Find or create scribe/provider
      let scribeId: string | null = null;
      let providerId: string | null = null;

      if (shiftData.role === 'Scribe') {
        const scribe = await findOrCreateScribe(shiftData.person);
        scribeId = scribe.id;
      } else if (shiftData.role === 'Physician' || shiftData.role === 'MLP') {
        const provider = await findProviderByName(shiftData.person);
        if (provider) {
          providerId = provider.id;
        }
      }

      // Check if shift exists
      const existing = await prisma.shift.findFirst({
        where: {
          date: new Date(date.toISOString().split('T')[0]),
          zone,
          startTime,
          scribeId,
          providerId,
        },
      });

      // Upsert shift
      await upsertShift({
        date,
        zone,
        startTime,
        endTime,
        site: shiftData.site,
        scribeId,
        providerId,
      });

      if (existing) {
        if (existing.endTime !== endTime || existing.site !== shiftData.site) {
          summary.stats.updated++;
        } else {
          summary.stats.unchanged++;
        }
      } else {
        summary.stats.created++;
      }
    } catch (error: any) {
      summary.stats.errors++;
      summary.errors?.push({
        shift: shiftData,
        error: error.message,
      });
    }
  }

  summary.success = summary.stats.errors === 0;

  return summary;
}

/**
 * Detect changes between old and new shift data
 *
 * Used for notifications when schedules are updated.
 */
export async function detectChanges(
  oldShifts: ShiftWithRelations[],
  newShifts: ShiftWithRelations[]
): Promise<ShiftChange[]> {
  const changes: ShiftChange[] = [];

  // Build lookup maps
  const oldMap = new Map(
    oldShifts.map(s => [`${s.date}-${s.zone}-${s.startTime}`, s])
  );
  const newMap = new Map(
    newShifts.map(s => [`${s.date}-${s.zone}-${s.startTime}`, s])
  );

  // Detect additions and modifications
  for (const [key, newShift] of newMap) {
    const oldShift = oldMap.get(key);

    if (!oldShift) {
      changes.push({
        type: 'added',
        date: newShift.date.toISOString().split('T')[0],
        zone: newShift.zone,
        time: `${newShift.startTime}-${newShift.endTime}`,
        after: {
          scribe: newShift.scribe?.name,
          provider: newShift.provider?.name,
        },
      });
    } else if (
      oldShift.scribe?.name !== newShift.scribe?.name ||
      oldShift.provider?.name !== newShift.provider?.name
    ) {
      changes.push({
        type: 'modified',
        date: newShift.date.toISOString().split('T')[0],
        zone: newShift.zone,
        time: `${newShift.startTime}-${newShift.endTime}`,
        before: {
          scribe: oldShift.scribe?.name,
          provider: oldShift.provider?.name,
        },
        after: {
          scribe: newShift.scribe?.name,
          provider: newShift.provider?.name,
        },
      });
    }
  }

  // Detect removals
  for (const [key, oldShift] of oldMap) {
    if (!newMap.has(key)) {
      changes.push({
        type: 'removed',
        date: oldShift.date.toISOString().split('T')[0],
        zone: oldShift.zone,
        time: `${oldShift.startTime}-${oldShift.endTime}`,
        before: {
          scribe: oldShift.scribe?.name,
          provider: oldShift.provider?.name,
        },
      });
    }
  }

  return changes;
}

/**
 * Clean up old shifts (older than 90 days)
 *
 * Keeps database size manageable while preserving recent history.
 */
export async function cleanupOldShifts(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.shift.deleteMany({
    where: {
      date: {
        lt: new Date(cutoffDate.toISOString().split('T')[0]),
      },
    },
  });

  return result.count;
}

/**
 * Get all scribes
 */
export async function getAllScribes() {
  return prisma.scribe.findMany({
    orderBy: { name: 'asc' },
  });
}

/**
 * Get scribe with their shifts
 */
export async function getScribeWithShifts(scribeId: string) {
  return prisma.scribe.findUnique({
    where: { id: scribeId },
    include: {
      shifts: {
        include: {
          provider: true,
        },
        orderBy: { date: 'desc' },
        take: 50,
      },
    },
  });
}
