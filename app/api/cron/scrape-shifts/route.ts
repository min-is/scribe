/**
 * GET /api/cron/scrape-shifts
 *
 * Vercel Cron endpoint to automatically scrape shifts every 12 hours
 * Triggered by Vercel's cron scheduler
 */

import { NextRequest, NextResponse } from 'next/server';
import { ShiftGenSyncService } from '@/lib/shiftgen/sync';
import type { SyncResult } from '@/lib/shiftgen/sync';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a Vercel Cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    console.log('Starting scheduled ShiftGen scrape...');
    const syncService = new ShiftGenSyncService();
    const result: SyncResult = await syncService.runSync();

    console.log('Scheduled scrape complete:', {
      success: result.success,
      scraped: result.shiftsScraped,
      created: result.shiftsCreated,
      updated: result.shiftsUpdated,
      errors: result.errors.length,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 207,
    });
  } catch (error) {
    console.error('Cron scrape error:', error);
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
