/**
 * DEBUG ENDPOINT - GET /api/debug/shifts
 * Inspect raw shift data from database
 *
 * Query params:
 * - date: Filter by specific date (YYYY-MM-DD)
 * - detailed: Show detailed view (true/false)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('date');
    const detailed = searchParams.get('detailed') === 'true';

    // Build where clause
    const where: any = {};
    if (dateFilter) {
      const [year, month, day] = dateFilter.split('-').map(Number);
      const filterDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      where.date = filterDate;
    }

    // Get all shifts with their relations
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

    // Group shifts by date
    const shiftsByDate = shifts.reduce((acc, shift) => {
      const dateStr = shift.date.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push({
        id: shift.id,
        date: shift.date.toISOString(),
        zone: shift.zone,
        startTime: shift.startTime,
        endTime: shift.endTime,
        site: shift.site,
        scribe: shift.scribe ? {
          id: shift.scribeId,
          name: shift.scribe.name,
          standardizedName: shift.scribe.standardizedName,
        } : null,
        provider: shift.provider ? {
          id: shift.providerId,
          name: shift.provider.name,
          slug: shift.provider.slug,
        } : null,
        hasScribe: !!shift.scribeId,
        hasProvider: !!shift.providerId,
        createdAt: shift.createdAt.toISOString(),
        updatedAt: shift.updatedAt.toISOString(),
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Get date range
    const dates = Object.keys(shiftsByDate).sort();
    const dateRange = dates.length > 0 ? {
      first: dates[0],
      last: dates[dates.length - 1],
      count: dates.length,
    } : null;

    // Count shifts by criteria
    const stats = {
      total: shifts.length,
      withScribe: shifts.filter(s => s.scribeId).length,
      withProvider: shifts.filter(s => s.providerId).length,
      withBoth: shifts.filter(s => s.scribeId && s.providerId).length,
      withNeither: shifts.filter(s => !s.scribeId && !s.providerId).length,
      scribeOnly: shifts.filter(s => s.scribeId && !s.providerId).length,
      providerOnly: shifts.filter(s => !s.scribeId && s.providerId).length,
    };

    // Get counts by zone
    const byZone = shifts.reduce((acc, shift) => {
      if (!acc[shift.zone]) {
        acc[shift.zone] = {
          total: 0,
          withScribe: 0,
          withProvider: 0,
          withBoth: 0,
        };
      }
      acc[shift.zone].total++;
      if (shift.scribeId) acc[shift.zone].withScribe++;
      if (shift.providerId) acc[shift.zone].withProvider++;
      if (shift.scribeId && shift.providerId) acc[shift.zone].withBoth++;
      return acc;
    }, {} as Record<string, any>);

    // Check for duplicates (multiple shifts for same slot)
    const duplicates: any[] = [];
    const seen = new Map<string, any[]>();
    for (const shift of shifts) {
      const key = `${shift.date.toISOString().split('T')[0]}-${shift.zone}-${shift.startTime}`;
      if (!seen.has(key)) {
        seen.set(key, []);
      }
      seen.get(key)!.push({
        id: shift.id,
        scribe: shift.scribe?.name,
        provider: shift.provider?.name,
      });
    }
    for (const [key, group] of seen.entries()) {
      if (group.length > 1) {
        duplicates.push({
          slot: key,
          count: group.length,
          shifts: group,
        });
      }
    }

    const response: any = {
      success: true,
      stats,
      byZone,
      dateRange,
      duplicates: {
        count: duplicates.length,
        examples: duplicates.slice(0, 10),
      },
      timestamp: new Date().toISOString(),
    };

    if (detailed) {
      response.shiftsByDate = shiftsByDate;
      response.allShifts = shifts.map(s => ({
        id: s.id,
        date: s.date.toISOString().split('T')[0],
        zone: s.zone,
        time: `${s.startTime}-${s.endTime}`,
        scribe: s.scribe?.name || null,
        provider: s.provider?.name || null,
      }));
    } else {
      response.sampleShifts = shifts.slice(0, 20).map(s => ({
        id: s.id,
        date: s.date.toISOString().split('T')[0],
        zone: s.zone,
        time: `${s.startTime}-${s.endTime}`,
        scribe: s.scribe?.name || null,
        provider: s.provider?.name || null,
      }));
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching debug shifts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
