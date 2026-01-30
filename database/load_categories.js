// Load categories into the database
// Usage: node database/load_categories.js "your_database_url_here"

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Try to load .env.local if it exists
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not installed or .env.local doesn't exist - that's ok
}

async function loadCategories() {
  let databaseUrl = process.env.DATABASE_URL;

  // Allow DATABASE_URL to be passed as a command-line argument
  if (process.argv[2]) {
    databaseUrl = process.argv[2];
  }

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found.');
    console.log('\nPlease provide the DATABASE_URL as an argument or in a .env.local file.');
    console.log('Example: node database/load_categories.js "postgresql://user:pass@host:port/db"');
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

    // Check current category count
    const countResult = await client.query('SELECT COUNT(*) FROM categories');
    const currentCount = parseInt(countResult.rows[0].count, 10);
    console.log(`\n📊 Current categories in database: ${currentCount}`);

    // Check if column_span exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'column_span'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('\n⚠️  column_span column not found. Adding it first...');
      await client.query(`
        ALTER TABLE categories
        ADD COLUMN IF NOT EXISTS column_span INTEGER DEFAULT 1 CHECK (column_span IN (1, 2))
      `);
      await client.query('UPDATE categories SET column_span = 1 WHERE column_span IS NULL');
      console.log('✅ column_span column added');
    }

    console.log('\n📝 Loading categories...');
    
    // Read and execute SQL
    const sqlPath = path.join(__dirname, 'load_categories.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Categories loaded successfully!');
    
    // Verify the categories were added
    const verifyResult = await client.query('SELECT COUNT(*) FROM categories');
    const newCount = parseInt(verifyResult.rows[0].count, 10);
    console.log(`📊 New category count: ${newCount}`);
    
    if (newCount > currentCount) {
      console.log(`✅ Added ${newCount - currentCount} new categories`);
    }

    // Show the categories
    const categoriesResult = await client.query(`
      SELECT id, name, slug, parent_id, display_order, column_span 
      FROM categories 
      ORDER BY display_order, name
    `);
    
    console.log('\n📋 Categories in database:');
    categoriesResult.rows.forEach(cat => {
      const indent = cat.parent_id ? '  └─ ' : '';
      console.log(`   ${indent}${cat.name} (${cat.slug}) - ${cat.column_span} column(s)`);
    });

    client.release();
    await pool.end();
    console.log('\n✅ All done! Categories have been loaded.');
    
  } catch (error) {
    console.error('\n❌ Failed to load categories:');
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

loadCategories();

