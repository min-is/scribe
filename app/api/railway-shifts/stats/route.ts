/**
 * API Route: Get Railway database statistics
 *
 * This endpoint provides statistics about the Railway Postgres database
 * including total shifts, scribes, providers, and date range.
 */

import { NextResponse } from 'next/server';
import { getRailwayDatabaseStats, testRailwayConnection } from '@/lib/railway-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test connection first
    const isConnected = await testRailwayConnection();

    if (!isConnected) {
      return NextResponse.json(
        { error: 'Failed to connect to Railway database' },
        { status: 500 }
      );
    }

    // Get statistics
    const stats = await getRailwayDatabaseStats();

    return NextResponse.json({
      success: true,
      connected: true,
      ...stats,
    });
  } catch (error) {
    console.error('Error fetching Railway database stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database statistics' },
      { status: 500 }
    );
  }
}
