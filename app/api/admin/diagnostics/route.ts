import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {},
    database: {},
    tables: {},
    errors: [],
  };

  try {
    // Check environment variables
    diagnostics.environment = {
      DATABASE_URL: process.env.DATABASE_URL ? '✓ Set' : '✗ Not set',
      POSTGRES_URL: process.env.POSTGRES_URL ? '✓ Set' : '✗ Not set',
      PRISMA_DATABASE_URL: process.env.PRISMA_DATABASE_URL ? '✓ Set' : '✗ Not set',
      NODE_ENV: process.env.NODE_ENV,
    };

    // Use any available database URL
    const databaseUrl =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.PRISMA_DATABASE_URL;

    if (!databaseUrl) {
      diagnostics.errors.push('No database URL found (checked DATABASE_URL, POSTGRES_URL, PRISMA_DATABASE_URL)');
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Log which one is being used
    const envVarUsed = process.env.DATABASE_URL ? 'DATABASE_URL' :
                       process.env.POSTGRES_URL ? 'POSTGRES_URL' :
                       'PRISMA_DATABASE_URL';
    diagnostics.environment.using = `✓ Using ${envVarUsed}`;

    // Try to connect to database
    const pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5000,
    });

    try {
      const connectStart = Date.now();
      const client = await pool.connect();
      const connectTime = Date.now() - connectStart;

      diagnostics.database.connection = {
        status: '✓ Connected',
        timeMs: connectTime,
      };

      // Check PostgreSQL version
      const versionResult = await client.query('SELECT version()');
      diagnostics.database.version = versionResult.rows[0].version;

      // Check if tables exist
      const tablesResult = await client.query(`
        SELECT table_name,
               (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public'
          AND table_name IN ('SmartPhrase', 'Scenario', 'Procedure', 'Provider')
        ORDER BY table_name
      `);

      diagnostics.tables.found = tablesResult.rows.map(row => ({
        name: row.table_name,
        columns: parseInt(row.column_count),
      }));

      // Check for each specific table
      for (const tableName of ['SmartPhrase', 'Scenario', 'Procedure', 'Provider']) {
        const exists = tablesResult.rows.some(row => row.table_name === tableName);
        diagnostics.tables[tableName] = exists ? '✓ Exists' : '✗ Missing';

        if (exists) {
          // Get row count
          const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
          diagnostics.tables[`${tableName}_rows`] = parseInt(countResult.rows[0].count);
        }
      }

      // Check indexes
      const indexResult = await client.query(`
        SELECT tablename, indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename IN ('SmartPhrase', 'Scenario', 'Procedure')
        ORDER BY tablename, indexname
      `);

      diagnostics.tables.indexes = indexResult.rows;

      client.release();
      await pool.end();

    } catch (dbError: any) {
      diagnostics.database.connection = {
        status: '✗ Failed',
        error: dbError.message,
      };
      diagnostics.errors.push(`Database connection error: ${dbError.message}`);
    }

  } catch (error: any) {
    diagnostics.errors.push(`Unexpected error: ${error.message}`);
  }

  // Determine overall status
  const hasMissingTables =
    diagnostics.tables.SmartPhrase === '✗ Missing' ||
    diagnostics.tables.Scenario === '✗ Missing' ||
    diagnostics.tables.Procedure === '✗ Missing';

  diagnostics.status = diagnostics.errors.length > 0 || hasMissingTables ? 'ISSUES_FOUND' : 'OK';

  return NextResponse.json(diagnostics, {
    status: diagnostics.status === 'OK' ? 200 : 500,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
