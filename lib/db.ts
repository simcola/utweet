import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

function sslForDatabaseUrl(databaseUrl: string) {
  // Hosted Postgres commonly requires SSL even in dev.
  // For localhost, SSL is usually unnecessary.
  try {
    const u = new URL(databaseUrl);
    const host = (u.hostname || '').toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (isLocal) return false;
    return { rejectUnauthorized: false } as const;
  } catch {
    return process.env.NODE_ENV === 'production' ? ({ rejectUnauthorized: false } as const) : false;
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslForDatabaseUrl(process.env.DATABASE_URL),
});

export default pool;

