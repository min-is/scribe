import { NextRequest, NextResponse } from 'next/server';
import {
  getShiftsInRange,
  validateShiftQueryParams,
  ApiResponse,
  ShiftQueryParams,
} from '@/lib/shiftgen';

export const dynamic = 'force-dynamic';

/**
 * GET /api/shifts/range - Query shifts within a date range
 *
 * Query Parameters:
 * - startDate: Start date in YYYY-MM-DD format (required)
 * - endDate: End date in YYYY-MM-DD format (required)
 * - zone: Filter by zone (optional)
 * - scribeId: Filter by scribe ID (optional)
 * - providerId: Filter by provider ID (optional)
 * - site: Filter by site (optional)
 *
 * Example: /api/shifts/range?startDate=2025-12-01&endDate=2025-12-07
 * Example: /api/shifts/range?startDate=2025-12-01&endDate=2025-12-07&zone=A
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const zone = searchParams.get('zone');
    const scribeId = searchParams.get('scribeId');
    const providerId = searchParams.get('providerId');
    const site = searchParams.get('site');

    // Validate required parameters
    if (!startDate || !endDate) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required parameters',
        message: 'Please provide both startDate and endDate in YYYY-MM-DD format',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Build query params
    const queryParams: ShiftQueryParams = {
      startDate,
      endDate,
    };
    if (zone) queryParams.zone = zone;
    if (scribeId) queryParams.scribeId = scribeId;
    if (providerId) queryParams.providerId = providerId;
    if (site) queryParams.site = site;

    // Validate parameters
    const validation = validateShiftQueryParams(queryParams);
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
    const start = new Date(startDate);
    const end = new Date(endDate);
    const shifts = await getShiftsInRange(start, end, {
      zone: zone || undefined,
      scribeId: scribeId || undefined,
      providerId: providerId || undefined,
      site: site || undefined,
    });

    const response: ApiResponse = {
      success: true,
      data: {
        startDate,
        endDate,
        filters: {
          zone: zone || null,
          scribeId: scribeId || null,
          providerId: providerId || null,
          site: site || null,
        },
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
    console.error('Error fetching shifts in range:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch shifts',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
