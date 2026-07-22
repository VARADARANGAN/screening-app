/**
 * Database Connection Module
 * Provides a flexible PostgreSQL client that works with any provider (Neon, Supabase, etc.)
 * Environment variables: DATABASE_URL or individual DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 */

import { Pool, QueryResult } from 'pg';

let pool: Pool | null = null;

/**
 * Initialize database connection pool
 * Supports both DATABASE_URL and individual connection parameters
 */
export function initializeDatabase(): Pool {
  if (pool) {
    return pool;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    // Use DATABASE_URL if provided (format: postgresql://user:password@host:port/dbname)
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    });
  } else {
    // Fallback to individual connection parameters
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'aptitude_portal',
      ssl: { rejectUnauthorized: false },
    });
  }

  // Handle pool errors
  pool.on('error', (err) => {
    console.error('[Database Pool Error]', err);
    pool = null;
  });

  console.log('[Database] Connection pool initialized');
  return pool;
}

/**
 * Get or initialize database pool
 */
export function getPool(): Pool {
  if (!pool) {
    initializeDatabase();
  }
  return pool!;
}

/**
 * Execute a query with optional parameters
 * @param query SQL query string
 * @param params Query parameters for parameterized queries
 */
export async function query<T = any>(
  queryString: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  const pool = getPool();
  
  try {
    const result = await pool.query(queryString, params);
    return result;
  } catch (error) {
    console.error('[Database Query Error]', {
      query: queryString,
      params,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Execute a single row query
 * @param query SQL query string
 * @param params Query parameters
 */
export async function queryOne<T = any>(
  queryString: string,
  params: any[] = []
): Promise<T | null> {
  const result = await query<T>(queryString, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Execute a query and return all rows
 * @param query SQL query string
 * @param params Query parameters
 */
export async function queryAll<T = any>(
  queryString: string,
  params: any[] = []
): Promise<T[]> {
  const result = await query<T>(queryString, params);
  return result.rows;
}

/**
 * Execute a query and return the count
 * @param query SQL query string
 * @param params Query parameters
 */
export async function queryCount(
  queryString: string,
  params: any[] = []
): Promise<number> {
  const result = await query<{ count: number }>(queryString, params);
  return parseInt(result.rows[0]?.count || 0, 10);
}

/**
 * Transaction execution helper
 * @param callback Function to execute within transaction
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close database pool connection
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[Database] Connection pool closed');
  }
}

/**
 * Health check for database connection
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    console.error('[Database Health Check Failed]', error);
    return false;
  }
}

// Initialize pool lazily on first use (safer for Next.js edge environments)

export default {
  query,
  queryOne,
  queryAll,
  queryCount,
  transaction,
  healthCheck,
  getPool,
  closePool,
};
