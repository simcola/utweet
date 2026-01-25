// Run migration to add countries table and country_id column
// Usage: node database/run_migration.js

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

    // Read migration file
    const migrationPath = path.join(__dirname, 'migration_add_countries.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📝 Running migration...');
    await client.query(migrationSQL);

    // Verify migration
    console.log('\n✅ Verifying migration...');
    const countriesCheck = await client.query('SELECT COUNT(*) FROM countries');
    const itemsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'items' AND column_name = 'country_id'
    `);

    console.log(`✅ Countries table: ${countriesCheck.rows[0].count} countries inserted`);
    console.log(`✅ Items table: country_id column ${itemsCheck.rows.length > 0 ? 'exists' : 'missing'}`);

    client.release();
    await pool.end();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error('Error:', error.message);
    if (error.code === '42P07') {
      console.error('\n💡 Table already exists - this is OK if you ran the migration before');
    } else if (error.code === '42701') {
      console.error('\n💡 Column already exists - this is OK if you ran the migration before');
    }
    process.exit(1);
  }
}

runMigration();


