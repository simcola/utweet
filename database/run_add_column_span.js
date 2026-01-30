// Run migration to add column_span to categories table
// Usage: node database/run_add_column_span.js "your_database_url_here"

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
    console.log('Example: node database/run_add_column_span.js "postgresql://user:pass@host:port/db"');
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

    // Check if column already exists
    const checkColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'column_span'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ column_span column already exists in categories table');
      
      // Verify it works
      const testQuery = await client.query('SELECT column_span FROM categories LIMIT 1');
      console.log('✅ Column is accessible');
      
      client.release();
      await pool.end();
      return;
    }

    console.log('\n📝 Running migration to add column_span...');
    
    // Read and execute migration
    const migrationPath = path.join(__dirname, 'migration_add_column_span.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the column was added
    const verifyQuery = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'column_span'
    `);
    
    if (verifyQuery.rows.length > 0) {
      console.log('✅ Verified: column_span column exists');
      console.log('   Type:', verifyQuery.rows[0].data_type);
      console.log('   Default:', verifyQuery.rows[0].column_default);
    }

    client.release();
    await pool.end();
    console.log('\n✅ All done! The column_span column has been added to the categories table.');
    
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

