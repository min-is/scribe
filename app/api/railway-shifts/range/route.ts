/**
 * API Route: Get shifts for a date range from Railway database
 *
 * This endpoint fetches shift data for a date range from the external
 * Railway Postgres database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRailwayShiftsForRange } from '@/lib/railway-db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Both startDate and endDate parameters are required (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Validate date formats
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Fetch shifts from Railway database
    const shifts = await getRailwayShiftsForRange(startDate, endDate);

    // Group shifts by date
    const shiftsByDate: Record<string, any[]> = {};

    shifts.forEach(shift => {
      if (!shiftsByDate[shift.date]) {
        shiftsByDate[shift.date] = [];
      }
      shiftsByDate[shift.date].push(shift);
    });

    return NextResponse.json({
      success: true,
      startDate,
      endDate,
      shifts: shiftsByDate,
      totalShifts: shifts.length,
    });
  } catch (error) {
    console.error('Error fetching shifts range from Railway:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shifts from Railway database' },
      { status: 500 }
    );
  }
}
