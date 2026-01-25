// Run migration to add News category
// Usage: node database/run_news_category_migration.js

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
    const migrationPath = path.join(__dirname, 'migration_add_news_category.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📝 Running migration...');
    await client.query(migrationSQL);

    // Verify migration
    console.log('\n✅ Verifying migration...');
    const newsCategoryCheck = await client.query(
      "SELECT id, name, display_order FROM categories WHERE slug = 'news'"
    );

    if (newsCategoryCheck.rows.length > 0) {
      console.log(`✅ News category: ${newsCategoryCheck.rows[0].name} (display_order: ${newsCategoryCheck.rows[0].display_order})`);
    } else {
      console.log('⚠️  News category not found');
    }

    client.release();
    await pool.end();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

runMigration();







