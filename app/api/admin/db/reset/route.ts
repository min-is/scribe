/**
 * POST /api/admin/db/reset
 * Reset database - delete all shifts (DANGEROUS!)
 */

import { NextRequest, NextResponse } from 'next/server';
import { resetDatabase } from '@/lib/shiftgen';

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication (simple passcode check)
    const authHeader = request.headers.get('authorization');
    const adminPasscode = process.env.ADMIN_PASSCODE || '5150';

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid authorization header',
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    if (token !== adminPasscode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid passcode',
        },
        { status: 403 }
      );
    }

    // Require confirmation
    const body = await request.json();
    if (body.confirm !== 'RESET') {
      return NextResponse.json(
        {
          success: false,
          error: 'Confirmation required. Send { "confirm": "RESET" } in request body.',
        },
        { status: 400 }
      );
    }

    console.log('RESETTING DATABASE - DELETING ALL SHIFTS...');
    const result = await resetDatabase();

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error resetting database:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
