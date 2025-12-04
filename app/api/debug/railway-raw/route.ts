/**
 * Debug API Route: Inspect raw Railway database data
 *
 * This endpoint shows raw shift data to help diagnose role value case issues.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json(
      { error: 'Date parameter is required (format: YYYY-MM-DD)' },
      { status: 400 }
    );
  }

  const pool = new Pool({
    connectionString: process.env.RAILWAY_DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();

    try {
      // Get all shifts for the date (no filtering)
      const result = await client.query(
        `SELECT id, date, label, time, person, role, site, created_at, updated_at
         FROM shifts
         WHERE date = $1
         ORDER BY label, time, role`,
        [date]
      );

      // Group by role to see what values exist
      const roleGroups: Record<string, any[]> = {};
      const uniqueRoles = new Set<string>();

      result.rows.forEach(row => {
        uniqueRoles.add(row.role);
        if (!roleGroups[row.role]) {
          roleGroups[row.role] = [];
        }
        roleGroups[row.role].push({
          label: row.label,
          time: row.time,
          person: row.person,
          site: row.site,
        });
      });

      return NextResponse.json({
        success: true,
        date,
        totalShifts: result.rows.length,
        uniqueRoles: Array.from(uniqueRoles),
        roleGroups,
        sampleRawRows: result.rows.slice(0, 10), // First 10 rows as examples
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error querying Railway database:', error);
    return NextResponse.json(
      {
        error: 'Database query failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await pool.end();
  }
}
