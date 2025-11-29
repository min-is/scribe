/**
 * Database utilities for shift management
 */

import { PrismaClient, Shift, Scribe, Provider } from '@prisma/client';
import { ShiftWithRelations, ScraperShiftData, ShiftChange } from './types';

const prisma = new PrismaClient();

/**
 * Get shifts for a specific date with relations
 */
export async function getShiftsForDate(date: Date): Promise<ShiftWithRelations[]> {
  const shifts = await prisma.shift.findMany({
    where: {
      date: date,
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
 * Get shifts for a date range
 */
export async function getShiftsInRange(
  startDate: Date,
  endDate: Date
): Promise<ShiftWithRelations[]> {
  const shifts = await prisma.shift.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
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
export async function getCurrentShifts(): Promise<ShiftWithRelations[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Get current time in HHMM format
  const currentTime = now.getHours().toString().padStart(2, '0') +
    now.getMinutes().toString().padStart(2, '0');

  const shifts = await prisma.shift.findMany({
    where: {
      date: today,
      startTime: {
        lte: currentTime,
      },
      endTime: {
        gte: currentTime,
      },
    },
    include: {
      scribe: true,
      provider: true,
    },
    orderBy: [
      { zone: 'asc' },
    ],
  });

  return shifts;
}

/**
 * Find or create a scribe by name
 */
export async function findOrCreateScribe(
  name: string,
  standardizedName?: string
): Promise<Scribe> {
  // Try to find existing scribe
  let scribe = await prisma.scribe.findUnique({
    where: { name },
  });

  // Create if doesn't exist
  if (!scribe) {
    scribe = await prisma.scribe.create({
      data: {
        name,
        standardizedName: standardizedName || name,
      },
    });
  } else if (standardizedName && scribe.standardizedName !== standardizedName) {
    // Update standardized name if changed
    scribe = await prisma.scribe.update({
      where: { id: scribe.id },
      data: { standardizedName },
    });
  }

  return scribe;
}

/**
 * Find provider by name (case-insensitive)
 */
export async function findProviderByName(name: string): Promise<Provider | null> {
  // Try exact match first
  let provider = await prisma.provider.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
  });

  // If not found, try partial match (e.g., "Dr. Smith" matching "SMITH")
  if (!provider) {
    provider = await prisma.provider.findFirst({
      where: {
        name: {
          contains: name.replace(/^Dr\.\s*/i, ''),
          mode: 'insensitive',
        },
      },
    });
  }

  return provider;
}

/**
 * Upsert a shift (create or update)
 */
export async function upsertShift(data: {
  date: Date;
  zone: string;
  startTime: string;
  endTime: string;
  site: string;
  scribeId?: string;
  providerId?: string;
}): Promise<Shift> {
  // Check if shift already exists
  const existing = await prisma.shift.findFirst({
    where: {
      date: data.date,
      zone: data.zone,
      startTime: data.startTime,
      scribeId: data.scribeId || null,
      providerId: data.providerId || null,
    },
  });

  if (existing) {
    // Update existing shift
    return await prisma.shift.update({
      where: { id: existing.id },
      data: {
        endTime: data.endTime,
        site: data.site,
        updatedAt: new Date(),
      },
    });
  } else {
    // Create new shift
    return await prisma.shift.create({
      data,
    });
  }
}

/**
 * Delete shifts that are no longer in the new data
 * (for full refresh strategy)
 */
export async function deleteShiftsNotInList(
  date: Date,
  keepShiftIds: string[]
): Promise<number> {
  const result = await prisma.shift.deleteMany({
    where: {
      date: date,
      id: {
        notIn: keepShiftIds,
      },
    },
  });

  return result.count;
}

/**
 * Compare old and new shift data to detect changes
 */
export function detectChanges(
  oldShifts: ShiftWithRelations[],
  newShifts: ShiftWithRelations[]
): ShiftChange[] {
  const changes: ShiftChange[] = [];

  // Create lookup maps
  const oldMap = new Map(
    oldShifts.map((s) => [
      `${s.date.toISOString()}-${s.zone}-${s.startTime}`,
      s,
    ])
  );

  const newMap = new Map(
    newShifts.map((s) => [
      `${s.date.toISOString()}-${s.zone}-${s.startTime}`,
      s,
    ])
  );

  // Find removed shifts
  for (const [key, oldShift] of oldMap) {
    if (!newMap.has(key)) {
      changes.push({
        type: 'removed',
        date: oldShift.date.toISOString().split('T')[0],
        zone: oldShift.zone,
        old: {
          scribe: oldShift.scribe?.name,
          provider: oldShift.provider?.name,
          time: `${oldShift.startTime}-${oldShift.endTime}`,
        },
      });
    }
  }

  // Find added or modified shifts
  for (const [key, newShift] of newMap) {
    const oldShift = oldMap.get(key);

    if (!oldShift) {
      // Added shift
      changes.push({
        type: 'added',
        date: newShift.date.toISOString().split('T')[0],
        zone: newShift.zone,
        new: {
          scribe: newShift.scribe?.name,
          provider: newShift.provider?.name,
          time: `${newShift.startTime}-${newShift.endTime}`,
        },
      });
    } else {
      // Check for modifications
      const scribeChanged = oldShift.scribeId !== newShift.scribeId;
      const providerChanged = oldShift.providerId !== newShift.providerId;
      const timeChanged = oldShift.endTime !== newShift.endTime;

      if (scribeChanged || providerChanged || timeChanged) {
        changes.push({
          type: 'modified',
          date: newShift.date.toISOString().split('T')[0],
          zone: newShift.zone,
          old: {
            scribe: oldShift.scribe?.name,
            provider: oldShift.provider?.name,
            time: `${oldShift.startTime}-${oldShift.endTime}`,
          },
          new: {
            scribe: newShift.scribe?.name,
            provider: newShift.provider?.name,
            time: `${newShift.startTime}-${newShift.endTime}`,
          },
        });
      }
    }
  }

  return changes;
}

/**
 * Clean up old shifts (older than 90 days)
 */
export async function cleanupOldShifts(daysToKeep: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  const result = await prisma.shift.deleteMany({
    where: {
      date: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}
