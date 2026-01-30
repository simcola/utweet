// Run migration to add photos table
// Usage: node database/run_photos_migration.js

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Try to load .env.local if it exists
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not installed or .env.local doesn't exist - that's ok
}

async function runMigration() {
  const databaseUrl = process.argv[2] || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found.');
    console.log('\nPlease provide the DATABASE_URL as an argument or in a .env.local file.');
    console.log('Example: node database/run_photos_migration.js "postgresql://user:pass@host:port/db"');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('rds.amazonaws.com') || process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } 
      : false,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Read migration file
    const migrationPath = path.join(__dirname, 'migration_add_photos.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('\n📝 Running migration...');
    await client.query(migrationSQL);

    // Verify migration
    console.log('\n✅ Verifying migration...');
    const photosCheck = await client.query('SELECT COUNT(*) FROM photos');
    const photoLikesCheck = await client.query('SELECT COUNT(*) FROM photo_likes');

    console.log(`✅ Photos table: ${photosCheck.rows[0].count} photos`);
    console.log(`✅ Photo_likes table: ${photoLikesCheck.rows[0].count} likes`);

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




