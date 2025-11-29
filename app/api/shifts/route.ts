/**
 * GET /api/shifts?date=YYYY-MM-DD
 * Query shifts by date
 */

import { NextRequest, NextResponse } from 'next/server';
import { getShiftsForDate, isValidDateFormat, ApiResponse, ShiftWithRelations } from '@/lib/shiftgen';

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

    const date = new Date(dateParam);
    const shifts = await getShiftsForDate(date);

    const response: ApiResponse<ShiftWithRelations[]> = {
      success: true,
      data: shifts,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
