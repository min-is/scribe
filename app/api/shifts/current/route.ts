import { NextRequest, NextResponse } from 'next/server';
import { getCurrentShifts, ApiResponse } from '@/lib/shiftgen';

export const dynamic = 'force-dynamic';

/**
 * GET /api/shifts/current - Get currently active shifts
 *
 * Returns shifts that are currently in progress based on the current time.
 *
 * Example: /api/shifts/current
 */
export async function GET(request: NextRequest) {
  try {
    const currentShifts = await getCurrentShifts();

    const response: ApiResponse = {
      success: true,
      data: {
        timestamp: currentShifts.timestamp.toISOString(),
        count: currentShifts.count,
        shifts: currentShifts.activeShifts.map(shift => ({
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
    console.error('Error fetching current shifts:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch current shifts',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
