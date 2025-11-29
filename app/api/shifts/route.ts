import { NextRequest, NextResponse } from 'next/server';
import {
  getShiftsForDate,
  validateShiftQueryParams,
  ApiResponse,
} from '@/lib/shiftgen';

export const dynamic = 'force-dynamic';

/**
 * GET /api/shifts - Query shifts by date
 *
 * Query Parameters:
 * - date: Date in YYYY-MM-DD format (required)
 *
 * Example: /api/shifts?date=2025-12-01
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

    // Validate parameters
    const validation = validateShiftQueryParams({ date: dateParam });
    if (!validation.valid) {
      const response: ApiResponse = {
        success: false,
        error: 'Validation error',
        message: validation.errors.join(', '),
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Query shifts
    const date = new Date(dateParam);
    const shifts = await getShiftsForDate(date);

    const response: ApiResponse = {
      success: true,
      data: {
        date: dateParam,
        count: shifts.length,
        shifts: shifts.map(shift => ({
          id: shift.id,
          date: shift.date.toISOString().split('T')[0],
          zone: shift.zone,
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
        })),
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching shifts:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch shifts',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
