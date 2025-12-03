/**
 * API Route: Get daily shifts from Railway database
 *
 * This endpoint fetches shift data from the external Railway Postgres database
 * which contains correctly formatted shifts from the Discord bot.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRailwayShiftsForDate } from '@/lib/railway-db';
import { ZONE_CONFIGS, getZoneGroupForShift } from '@/lib/shiftgen/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Fetch shifts from Railway database
    const shifts = await getRailwayShiftsForDate(date);

    // Group shifts by zone
    const zoneGroups: Record<string, any[]> = {};

    // Initialize zone groups
    Object.keys(ZONE_CONFIGS).forEach(zone => {
      zoneGroups[zone] = [];
    });

    // Separate scribes and providers (case-insensitive)
    const scribes = shifts.filter(s => s.role.toLowerCase() === 'scribe');
    const providers = shifts.filter(s =>
      s.role.toLowerCase() === 'physician' || s.role.toLowerCase() === 'mlp'
    );

    // Match scribes with providers
    for (const scribe of scribes) {
      const zoneGroup = getZoneGroupForShift(scribe.label);

      if (!zoneGroup) continue;

      // Find matching provider by label and time
      const matchingProvider = providers.find(
        p => p.label === scribe.label && p.time === scribe.time
      );

      const shiftData = {
        label: scribe.label,
        time: scribe.time,
        scribe: scribe.person,
        provider: matchingProvider?.person || null,
        providerRole: matchingProvider?.role || null,
      };

      zoneGroups[zoneGroup].push(shiftData);
    }

    // Remove empty zones
    Object.keys(zoneGroups).forEach(zone => {
      if (zoneGroups[zone].length === 0) {
        delete zoneGroups[zone];
      }
    });

    return NextResponse.json({
      success: true,
      date,
      zones: zoneGroups,
    });
  } catch (error) {
    console.error('Error fetching daily shifts from Railway:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shifts from Railway database' },
      { status: 500 }
    );
  }
}
