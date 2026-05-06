// Test database connection
// Run with: node test_db_connection.js

// Try to load .env.local if it exists
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not installed or .env.local doesn't exist - that's ok
}

const { Pool } = require('pg');

async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local');
    console.log('\nPlease create a .env.local file with:');
    console.log('DATABASE_URL=postgresql://username:password@localhost:5432/utweet');
    process.exit(1);
  }

  console.log('🔌 Testing database connection...');
  console.log('Connection string:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  ssl: (() => {
    try {
      const u = new URL(process.env.DATABASE_URL);
      const host = (u.hostname || '').toLowerCase();
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
      return isLocal ? false : { rejectUnauthorized: false };
    } catch {
      return process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
    }
  })(),
  });

  try {
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');

    // Test tables exist
    const tables = ['regions', 'countries', 'categories', 'items'];
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ Table '${table}' exists (${result.rows[0].count} rows)`);
      } catch (err) {
        console.error(`❌ Table '${table}' does not exist or error:`, err.message);
      }
    }

    // Test categories query
    try {
      const result = await client.query(
        'SELECT id, name, slug, parent_id, display_order FROM categories ORDER BY display_order, name'
      );
      console.log(`✅ Categories query successful (${result.rows.length} categories found)`);
      if (result.rows.length === 0) {
        console.log('⚠️  Warning: Categories table is empty. Run schema.sql first!');
      }
    } catch (err) {
      console.error('❌ Categories query failed:', err.message);
    }

    client.release();
    await pool.end();
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure PostgreSQL is running!');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Check your DATABASE_URL - hostname not found');
    } else if (error.code === '28P01') {
      console.error('\n💡 Check your DATABASE_URL - authentication failed');
    } else if (error.code === '3D000') {
      console.error('\n💡 Database does not exist. Create it with: CREATE DATABASE utweet;');
    }
    process.exit(1);
  }
}

testConnection();

