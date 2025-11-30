/**
 * POST /api/shifts/scrape
 *
 * Triggers ShiftGen scraper to fetch and sync schedules
 * Requires API key authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { ShiftGenSyncService, SyncResult } from '@/lib/shiftgen';

export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.SHIFTGEN_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error: API key not set',
        },
        { status: 500 }
      );
    }

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
    if (token !== apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid API key',
        },
        { status: 403 }
      );
    }

    // Run sync
    console.log('Starting ShiftGen sync...');
    const syncService = new ShiftGenSyncService();
    const result: SyncResult = await syncService.runSync();

    // Return results
    return NextResponse.json(result, {
      status: result.success ? 200 : 207, // 207 = Multi-Status (partial success)
    });
  } catch (error) {
    console.error('Scrape API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        shiftsScraped: 0,
        shiftsCreated: 0,
        shiftsUpdated: 0,
        errors: [String(error)],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
