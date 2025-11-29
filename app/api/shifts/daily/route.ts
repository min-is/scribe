import { NextRequest, NextResponse } from 'next/server';
import {
  getDailySchedule,
  validateDateString,
  ApiResponse,
  formatShiftTime,
} from '@/lib/shiftgen';

export const dynamic = 'force-dynamic';

/**
 * GET /api/shifts/daily - Get daily schedule with grouped shifts and summary
 *
 * Query Parameters:
 * - date: Date in YYYY-MM-DD format (required)
 *
 * Returns shifts grouped by time period (morning/afternoon/night) with summary stats.
 *
 * Example: /api/shifts/daily?date=2025-12-01
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    // Validate required parameters
    if (!dateParam) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required parameter: date',
        message: 'Please provide a date in YYYY-MM-DD format',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate date
    const validation = validateDateString(dateParam);
    if (!validation.valid) {
      const response: ApiResponse = {
        success: false,
        error: 'Validation error',
        message: validation.errors.join(', '),
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get daily schedule
    const date = new Date(dateParam);
    const schedule = await getDailySchedule(date);

    // Format response
    const formatShift = (shift: any) => ({
      id: shift.id,
      zone: shift.zone,
      time: formatShiftTime(shift.startTime, shift.endTime),
      startTime: shift.startTime,
      endTime: shift.endTime,
      site: shift.site,
      scribe: shift.scribe ? {
        id: shift.scribe.id,
        name: shift.scribe.name,
      } : null,
      provider: shift.provider ? {
        id: shift.provider.id,
        name: shift.provider.name,
        credentials: shift.provider.credentials,
      } : null,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        date: dateParam,
        summary: schedule.summary,
        grouped: {
          morning: schedule.grouped.morning.map(formatShift),
          afternoon: schedule.grouped.afternoon.map(formatShift),
          night: schedule.grouped.night.map(formatShift),
        },
        allShifts: schedule.shifts.map(formatShift),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching daily schedule:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch daily schedule',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
