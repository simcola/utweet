/**
 * One-time local DB setup: create database (if needed), run schema + US states migration.
 * Uses DATABASE_URL from .env.local — set your local Postgres user/password there.
 * Usage: node database/setup_local.js
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function getDbName(url) {
  try {
    const u = new URL(url.replace(/^postgresql:\/\//, 'https://'));
    const db = u.pathname.slice(1) || 'postgres';
    return db;
  } catch {
    return 'utweet';
  }
}

function urlForDb(url, dbName) {
  return url.replace(/\/([^/]+)(\?|$)/, `/${dbName}$2`);
}

async function setup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const dbName = getDbName(databaseUrl);
  const postgresUrl = urlForDb(databaseUrl, 'postgres');

  console.log('🔌 Connecting to PostgreSQL (database "postgres")...');
  const adminPool = new Pool({ connectionString: postgresUrl });
  adminPool.on('error', (err) => console.error('Pool error:', err));

  try {
    const client = await adminPool.connect();
    const exists = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );
    if (exists.rows.length === 0) {
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database "${dbName}" created.`);
    } else {
      console.log(`✅ Database "${dbName}" already exists.`);
    }
    client.release();
    await adminPool.end();
  } catch (err) {
    console.error('❌ Failed to create database:', err.message);
    process.exit(1);
  }

  console.log('\n🔌 Connecting to database...');
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    const client = await pool.connect();

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('\n📝 Running schema.sql...');
    await client.query(schemaSql);
    console.log('✅ Schema applied.');

    const migrationPath = path.join(__dirname, 'migration_add_us_states.sql');
    if (fs.existsSync(migrationPath)) {
      const migrationSql = fs.readFileSync(migrationPath, 'utf8');
      console.log('\n📝 Running US states migration...');
      await client.query(migrationSql);
      console.log('✅ US states migration applied.');
    }

    client.release();
    await pool.end();
    console.log('\n✅ Local setup complete. Start the app with: npm run dev');
  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    if (err.code === '42P07') console.error('   (Table already exists is OK.)');
    process.exit(1);
  }
}

setup();
