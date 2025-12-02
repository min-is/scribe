/**
 * GET /api/admin/db/stats
 * Get database statistics
 */

import { NextResponse } from 'next/server';
import { getDatabaseStats } from '@/lib/shiftgen';

export async function GET() {
  try {
    const stats = await getDatabaseStats();

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
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
