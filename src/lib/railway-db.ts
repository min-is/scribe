/**
 * Railway Postgres Database Connection
 *
 * This module connects to the external Railway Postgres database
 * that contains correctly formatted shift data from the Discord bot.
 */

import { Pool } from 'pg';

// Initialize connection pool for Railway database
const railwayPool = new Pool({
  connectionString: process.env.RAILWAY_DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export interface RailwayShift {
  id: number;
  date: string; // YYYY-MM-DD format
  label: string; // Shift letter (A, B, C, etc.)
  time: string; // HHMM-HHMM format
  person: string; // Scribe or provider name
  role: string; // 'Scribe', 'Physician', or 'MLP'
  site: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Get all shifts for a specific date from Railway database
 */
export async function getRailwayShiftsForDate(date: string): Promise<RailwayShift[]> {
  const client = await railwayPool.connect();

  try {
    const result = await client.query(
      `SELECT DISTINCT ON (date, label, time, role)
         date, label, time, person, role, site
       FROM shifts
       WHERE date = $1
       ORDER BY date, label, time, role, updated_at DESC`,
      [date]
    );

    return result.rows.map(row => ({
      ...row,
      date: row.date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
    }));
  } finally {
    client.release();
  }
}

/**
 * Get shifts for a date range from Railway database
 */
export async function getRailwayShiftsForRange(startDate: string, endDate: string): Promise<RailwayShift[]> {
  const client = await railwayPool.connect();

  try {
    const result = await client.query(
      `SELECT DISTINCT ON (date, label, time, role)
         date, label, time, person, role, site
       FROM shifts
       WHERE date BETWEEN $1 AND $2
       ORDER BY date, label, time, role, updated_at DESC`,
      [startDate, endDate]
    );

    return result.rows.map(row => ({
      ...row,
      date: row.date.toISOString().split('T')[0],
    }));
  } finally {
    client.release();
  }
}

/**
 * Get database statistics from Railway database
 */
export async function getRailwayDatabaseStats(): Promise<{
  totalShifts: number;
  totalScribes: number;
  totalProviders: number;
  dateRange: { min: string | null; max: string | null };
}> {
  const client = await railwayPool.connect();

  try {
    // Get total shifts
    const totalResult = await client.query('SELECT COUNT(*) FROM shifts');
    const totalShifts = parseInt(totalResult.rows[0].count);

    // Get unique scribes
    const scribesResult = await client.query(
      "SELECT COUNT(DISTINCT person) FROM shifts WHERE role = 'Scribe'"
    );
    const totalScribes = parseInt(scribesResult.rows[0].count);

    // Get unique providers (Physician + MLP)
    const providersResult = await client.query(
      "SELECT COUNT(DISTINCT person) FROM shifts WHERE role IN ('Physician', 'MLP')"
    );
    const totalProviders = parseInt(providersResult.rows[0].count);

    // Get date range
    const dateRangeResult = await client.query('SELECT MIN(date), MAX(date) FROM shifts');
    const minDate = dateRangeResult.rows[0].min
      ? dateRangeResult.rows[0].min.toISOString().split('T')[0]
      : null;
    const maxDate = dateRangeResult.rows[0].max
      ? dateRangeResult.rows[0].max.toISOString().split('T')[0]
      : null;

    return {
      totalShifts,
      totalScribes,
      totalProviders,
      dateRange: { min: minDate, max: maxDate },
    };
  } finally {
    client.release();
  }
}

/**
 * Test Railway database connection
 */
export async function testRailwayConnection(): Promise<boolean> {
  try {
    const client = await railwayPool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Railway database connection failed:', error);
    return false;
  }
}
