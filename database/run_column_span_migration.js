// Run migration to add column_span to categories table
// Usage: node database/run_column_span_migration.js

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
    const migrationPath = path.join(__dirname, 'migration_add_column_span.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📝 Running migration...');
    await client.query(migrationSQL);

    // Verify migration
    console.log('\n✅ Verifying migration...');
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'column_span'
    `);

    if (columnCheck.rows.length > 0) {
      console.log('✅ Categories table: column_span column exists');
      
      // Check shopping category
      const shoppingCheck = await client.query(`
        SELECT column_span FROM categories WHERE slug = 'shopping'
      `);
      if (shoppingCheck.rows.length > 0) {
        console.log(`✅ Shopping category: column_span = ${shoppingCheck.rows[0].column_span}`);
      }
    } else {
      console.log('❌ column_span column not found');
    }

    client.release();
    await pool.end();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error('Error:', error.message);
    if (error.code === '42701') {
      console.error('\n💡 Column already exists - this is OK if you ran the migration before');
    }
    process.exit(1);
  }
}

runMigration();






