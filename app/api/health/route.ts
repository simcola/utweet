import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// Health check endpoint to diagnose database connection issues
export async function GET() {
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database_url_set: !!process.env.DATABASE_URL,
      node_env: process.env.NODE_ENV || 'not set',
    },
  };

  // Test database connection
  if (!process.env.DATABASE_URL) {
    health.status = 'error';
    health.error = 'DATABASE_URL environment variable is not set';
    return NextResponse.json(health, { status: 500 });
  }

  try {
    // Test connection
    const client = await pool.connect();
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    health.checks.database_connected = true;
    health.checks.database_time = result.rows[0].current_time;
    health.checks.pg_version = result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1];
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('regions', 'categories', 'items', 'countries')
      ORDER BY table_name
    `);
    health.checks.tables_exist = tablesResult.rows.map((r: any) => r.table_name);
    
    // Check data counts
    try {
      const countsResult = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM regions) as regions,
          (SELECT COUNT(*) FROM categories) as categories,
          (SELECT COUNT(*) FROM items) as items,
          (SELECT COUNT(*) FROM countries) as countries
      `);
      health.checks.data_counts = countsResult.rows[0];
    } catch (e) {
      health.checks.data_counts = 'Error counting data - tables may not exist';
    }
    
    client.release();
    
  } catch (error: any) {
    health.status = 'error';
    health.error = error.message;
    health.error_code = error.code;
    health.error_hint = 
      error.code === 'ECONNREFUSED' 
        ? 'Database connection refused. Check DATABASE_URL hostname and RDS security group.'
        : error.code === '28P01' 
        ? 'Authentication failed. Check DATABASE_URL username and password.'
        : error.code === '3D000'
        ? 'Database does not exist. Check DATABASE_URL database name.'
        : error.code === 'ENOTFOUND'
        ? 'Database hostname not found. Check DATABASE_URL hostname.'
        : 'Check CloudWatch logs for more details.';
    
    return NextResponse.json(health, { status: 500 });
  }

  return NextResponse.json(health);
}

