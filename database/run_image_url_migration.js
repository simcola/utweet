// Run migration to change image_url column to TEXT
// Usage: node database/run_image_url_migration.js "your_database_url_here"

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
  let databaseUrl = process.env.DATABASE_URL;

  // Allow DATABASE_URL to be passed as a command-line argument
  if (process.argv[2]) {
    databaseUrl = process.argv[2];
  }

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found.');
    console.log('\nPlease provide the DATABASE_URL as an argument or in a .env.local file.');
    console.log('Example: node database/run_image_url_migration.js "postgresql://user:pass@host:port/db"');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...');
  console.log('Connection string:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('rds.amazonaws.com') || process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } 
      : false,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');

    // Check current column type
    const columnCheck = await client.query(`
      SELECT data_type, character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'photos' AND column_name = 'image_url'
    `);

    if (columnCheck.rows.length === 0) {
      console.error('❌ photos table or image_url column does not exist');
      client.release();
      await pool.end();
      process.exit(1);
    }

    const currentType = columnCheck.rows[0].data_type;
    const currentLength = columnCheck.rows[0].character_maximum_length;

    console.log(`\n📊 Current image_url column type: ${currentType}${currentLength ? `(${currentLength})` : ''}`);

    if (currentType === 'text') {
      console.log('✅ Column is already TEXT - no migration needed');
      client.release();
      await pool.end();
      return;
    }

    console.log('\n📝 Running migration to change image_url to TEXT...');
    
    // Read and execute migration
    const migrationPath = path.join(__dirname, 'migration_image_url_to_text.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the column was changed
    const verifyQuery = await client.query(`
      SELECT data_type
      FROM information_schema.columns 
      WHERE table_name = 'photos' AND column_name = 'image_url'
    `);
    
    if (verifyQuery.rows.length > 0) {
      console.log('✅ Verified: image_url column is now:', verifyQuery.rows[0].data_type);
    }

    client.release();
    await pool.end();
    console.log('\n✅ All done! The image_url column can now store base64 images.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error('Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure PostgreSQL is running and accessible from your network (check RDS security group inbound rules for your IP).');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Check your DATABASE_URL - hostname not found. Ensure the RDS endpoint is correct.');
    } else if (error.code === '28P01') {
      console.error('\n💡 Check your DATABASE_URL - authentication failed. Verify username and password.');
    } else if (error.code === '3D000') {
      console.error('\n💡 Database does not exist. Check the database name in your DATABASE_URL. Create it if necessary.');
    }
    process.exit(1);
  }
}

runMigration();

