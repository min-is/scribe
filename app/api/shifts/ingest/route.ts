import { NextRequest, NextResponse } from 'next/server';
import {
  syncShiftsFromScraper,
  validateShiftData,
  sanitizeShiftData,
  ApiResponse,
  ShiftIngestPayload,
  ScraperShiftData,
} from '@/lib/shiftgen';

export const dynamic = 'force-dynamic';

/**
 * POST /api/shifts/ingest - Ingest shift data from Python scraper
 *
 * Body:
 * {
 *   "shifts": [
 *     {
 *       "date": "2025-12-01",
 *       "label": "A",
 *       "time": "0800-1600",
 *       "person": "John Doe",
 *       "role": "Scribe",
 *       "site": "St Joseph Scribe"
 *     }
 *   ],
 *   "source": "discord-bot",
 *   "timestamp": "2025-12-01T10:00:00Z"
 * }
 *
 * Authentication: Requires API key in Authorization header
 * Format: Authorization: Bearer <api-key>
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.SHIFTGEN_API_KEY;

    if (!apiKey) {
      console.error('SHIFTGEN_API_KEY not configured');
      const response: ApiResponse = {
        success: false,
        error: 'Server configuration error',
        message: 'API key not configured',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 500 });
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 401 });
    }

    const providedKey = authHeader.substring(7); // Remove 'Bearer '
    if (providedKey !== apiKey) {
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid API key',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Parse request body
    const body: ShiftIngestPayload = await request.json();

    if (!body.shifts || !Array.isArray(body.shifts)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid request',
        message: 'Body must contain a "shifts" array',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (body.shifts.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid request',
        message: 'Shifts array cannot be empty',
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate and sanitize each shift
    const validationErrors: Array<{ index: number; errors: string[] }> = [];
    const sanitizedShifts: ScraperShiftData[] = [];

    body.shifts.forEach((shift, index) => {
      const validation = validateShiftData(shift);
      if (!validation.valid) {
        validationErrors.push({ index, errors: validation.errors });
      } else {
        sanitizedShifts.push(sanitizeShiftData(shift));
      }
    });

    // Return validation errors if any
    if (validationErrors.length > 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Validation failed',
        message: `${validationErrors.length} shifts failed validation`,
        data: { validationErrors },
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Sync shifts to database
    const syncResult = await syncShiftsFromScraper(sanitizedShifts);

    const response: ApiResponse = {
      success: syncResult.success,
      data: {
        summary: syncResult.stats,
        source: body.source || 'unknown',
        scraperTimestamp: body.timestamp || null,
        errors: syncResult.errors,
      },
      message: syncResult.success
        ? `Successfully synced ${syncResult.stats.created + syncResult.stats.updated} shifts`
        : `Sync completed with ${syncResult.stats.errors} errors`,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: syncResult.success ? 200 : 207, // 207 = Multi-Status (partial success)
    });
  } catch (error: any) {
    console.error('Error ingesting shifts:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      message: error.message || 'Failed to ingest shifts',
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(response, { status: 500 });
  }
}
