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

/**
 * Check if two shift times overlap or start within tolerance of each other.
 * For PA matching: scribe 1000-1830 should match MLP 1000-2000
 */
function timesOverlapOrClose(time1: string, time2: string, toleranceMinutes: number = 60): boolean {
  try {
    // Parse times (format: HHMM-HHMM)
    const [start1, end1] = time1.split('-');
    const [start2, end2] = time2.split('-');

    // Convert to minutes for comparison
    const toMinutes = (timeStr: string): number => {
      // Handle both 3 and 4 digit times
      if (timeStr.length === 3) {
        const h = parseInt(timeStr[0]);
        const m = parseInt(timeStr.slice(1));
        return h * 60 + m;
      } else {
        const h = parseInt(timeStr.slice(0, 2));
        const m = parseInt(timeStr.slice(2));
        return h * 60 + m;
      }
    };

    const s1 = toMinutes(start1);
    const s2 = toMinutes(start2);

    // Check if start times are within tolerance
    return Math.abs(s1 - s2) <= toleranceMinutes;
  } catch {
    return false;
  }
}

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

    console.log(`[Railway API] Fetched ${shifts.length} shifts for ${date}`);
    console.log(`[Railway API] Sample shift:`, shifts[0]);

    // Group shifts by zone
    const zoneGroups: Record<string, any[]> = {
      zone1: [],
      zone2: [],
      zones34: [],
      zones56: [],
      overflowPit: [],
    };

    // Separate scribes and providers (case-insensitive)
    const scribes = shifts.filter(s => s.role.toLowerCase() === 'scribe');
    const providers = shifts.filter(s => {
      const roleLower = s.role.toLowerCase();
      return roleLower === 'physician' || roleLower === 'mlp';
    });

    console.log(`[Railway API] Filtered ${scribes.length} scribes, ${providers.length} providers`);
    if (scribes.length > 0) {
      console.log(`[Railway API] Sample scribe:`, scribes[0]);
    }
    if (providers.length > 0) {
      console.log(`[Railway API] Sample provider:`, providers[0]);
    }

    // Match scribes with providers
    for (const scribe of scribes) {
      console.log(`[Railway API] Processing scribe: label="${scribe.label}", time="${scribe.time}", person="${scribe.person}"`);

      const zoneGroup = getZoneGroupForShift(scribe.label);
      console.log(`[Railway API] Zone group for "${scribe.label}": ${zoneGroup}`);

      if (!zoneGroup) {
        console.log(`[Railway API] WARNING: Skipping unrecognized shift label: ${scribe.label}`);
        continue;
      }

      // Find matching provider
      // For PA shifts, use time overlap matching (MLP times may differ)
      // For other shifts, require exact label and time match
      const isPAShift = scribe.label === 'PA';
      let matchingProvider;

      if (isPAShift) {
        // PA shifts: match MLPs by time overlap only
        matchingProvider = providers.find(
          p => p.role.toLowerCase() === 'mlp' && timesOverlapOrClose(scribe.time, p.time)
        );
        console.log(`[Railway API] PA shift - looking for MLP with overlapping time`);
      } else {
        // Regular shifts: match by exact label and time
        matchingProvider = providers.find(
          p => p.label === scribe.label && p.time === scribe.time
        );
      }

      if (matchingProvider) {
        console.log(`[Railway API] Found matching provider for ${scribe.label}: ${matchingProvider.person} (${matchingProvider.role})`);
      } else {
        console.log(`[Railway API] No matching provider for ${scribe.label} at ${scribe.time}`);
      }

      const shiftData = {
        label: scribe.label,
        time: scribe.time,
        scribe: scribe.person,
        provider: matchingProvider?.person || null,
        providerRole: matchingProvider?.role || null,
      };

      zoneGroups[zoneGroup].push(shiftData);
      console.log(`[Railway API] Added shift to ${zoneGroup}:`, shiftData);
    }

    // Remove empty zones
    Object.keys(zoneGroups).forEach(zone => {
      if (zoneGroups[zone].length === 0) {
        delete zoneGroups[zone];
      }
    });

    const totalShiftsInGroups = Object.values(zoneGroups).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`[Railway API] Returning ${totalShiftsInGroups} shifts across ${Object.keys(zoneGroups).length} zones`);
    console.log(`[Railway API] Zones with shifts:`, Object.keys(zoneGroups));

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
