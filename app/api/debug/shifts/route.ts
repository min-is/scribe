/**
 * DEBUG ENDPOINT - GET /api/debug/shifts
 * Inspect raw shift data from database
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all shifts with their relations
    const shifts = await prisma.shift.findMany({
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
        scribe: shift.scribe ? {
          name: shift.scribe.name,
          standardizedName: shift.scribe.standardizedName,
        } : null,
        provider: shift.provider ? {
          name: shift.provider.name,
        } : null,
        hasScribe: !!shift.scribeId,
        hasProvider: !!shift.providerId,
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
    };

    return NextResponse.json({
      success: true,
      stats,
      dateRange,
      shiftsByDate,
      sampleShifts: shifts.slice(0, 10),
      timestamp: new Date().toISOString(),
    });
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
