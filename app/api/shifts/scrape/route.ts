/**
 * ShiftGen Scrape API
 * Endpoint to trigger manual scraping of shift data
 */

import { NextRequest, NextResponse } from 'next/server';
import { scrapeAndSync } from '@/lib/shiftgen/sync';

/**
 * POST /api/shifts/scrape
 * Triggers a manual scrape of shift data from ShiftGen
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key authentication
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.SHIFTGEN_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error: SHIFTGEN_API_KEY not set',
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
        { status: 401 }
      );
    }

    // Check for required ShiftGen credentials
    if (!process.env.SHIFTGEN_USERNAME || !process.env.SHIFTGEN_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error: SHIFTGEN credentials not set',
        },
        { status: 500 }
      );
    }

    // Trigger scraping
    console.log('🚀 Starting ShiftGen scrape...');
    const result = await scrapeAndSync();

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Scrape endpoint error:', errorMsg);

    return NextResponse.json(
      {
        success: false,
        shiftsScraped: 0,
        shiftsCreated: 0,
        shiftsUpdated: 0,
        errors: [errorMsg],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
