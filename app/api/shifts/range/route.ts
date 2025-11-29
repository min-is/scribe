/**
 * GET /api/shifts/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&zone=A&scribeId=xxx&providerId=xxx&site=xxx
 * Query shifts in a date range with optional filters
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getShiftsInRange,
  isValidDateFormat,
  ApiResponse,
  ShiftWithRelations,
  ShiftFilters,
} from '@/lib/shiftgen';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (!startDateParam || !endDateParam) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Missing required parameters: startDate and endDate (format: YYYY-MM-DD)',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!isValidDateFormat(startDateParam) || !isValidDateFormat(endDateParam)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid date format. Expected: YYYY-MM-DD',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    // Optional filters
    const filters: ShiftFilters = {};
    const zone = searchParams.get('zone');
    const scribeId = searchParams.get('scribeId');
    const providerId = searchParams.get('providerId');
    const site = searchParams.get('site');

    if (zone) filters.zone = zone;
    if (scribeId) filters.scribeId = scribeId;
    if (providerId) filters.providerId = providerId;
    if (site) filters.site = site;

    const shifts = await getShiftsInRange(startDate, endDate, filters);

    const response: ApiResponse<ShiftWithRelations[]> = {
      success: true,
      data: shifts,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching shifts in range:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
