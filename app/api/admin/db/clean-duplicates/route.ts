/**
 * POST /api/admin/db/clean-duplicates
 * Clean duplicate shifts from database
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanDuplicateShifts } from '@/lib/shiftgen';

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

    console.log('Cleaning duplicate shifts...');
    const result = await cleanDuplicateShifts();

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error cleaning duplicates:', error);
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
