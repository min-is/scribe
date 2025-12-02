/**
 * GET /api/shifts/daily?date=YYYY-MM-DD
 * Get daily schedule with zone-based grouping
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDailyScheduleByZone, isValidDateFormat, parseDateStringToUTC, ApiResponse, DailySchedule } from '@/lib/shiftgen';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing required parameter: date (format: YYYY-MM-DD)',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!isValidDateFormat(dateParam)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid date format. Expected: YYYY-MM-DD',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Use parseDateStringToUTC to avoid timezone issues
    const date = parseDateStringToUTC(dateParam);
    const schedule = await getDailyScheduleByZone(date);

    const response: ApiResponse<DailySchedule> = {
      success: true,
      data: schedule,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching daily schedule:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
