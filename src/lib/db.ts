import { Pool } from 'pg';

// Create a connection pool for direct SQL queries
// This is used for models that can't use Prisma due to client generation issues
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Connection pool settings
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

// Helper to execute queries with error handling
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const pool = getPool();
  try {
    const result = await pool.query(text, params);
    return result.rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper to execute a single query and return one result
export async function queryOne<T = any>(
  text: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper to check if a table exists
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
      ) as exists`,
      [tableName]
    );
    return result[0]?.exists || false;
  } catch (error) {
    console.error('Error checking if table exists:', error);
    return false;
  }
}
