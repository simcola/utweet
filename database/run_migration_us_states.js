// Run migration to add item_us_states table (US state targeting)
// Usage: node database/run_migration_us_states.js
// Run after schema and countries migration.

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    const migrationPath = path.join(__dirname, 'migration_add_us_states.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📝 Running US states migration...');
    await client.query(migrationSQL);

    const check = await client.query(`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'item_us_states')
    `);
    console.log(`✅ item_us_states table: ${check.rows[0].exists ? 'exists' : 'missing'}`);

    client.release();
    await pool.end();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.code === '42P07') {
      console.error('\n💡 Table already exists - OK if you ran this before.');
    }
    process.exit(1);
  }
}

runMigration();
