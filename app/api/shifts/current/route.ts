/**
 * GET /api/shifts/current
 * Get currently active shifts
 */

import { NextResponse } from 'next/server';
import { getCurrentShifts, ApiResponse, CurrentShifts } from '@/lib/shiftgen';

export async function GET() {
  try {
    const currentShifts = await getCurrentShifts();

    const response: ApiResponse<CurrentShifts> = {
      success: true,
      data: currentShifts,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching current shifts:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
