// Load sample data into the database
// Usage: node database/load_sample_data.js

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function loadSampleData() {
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

    // Read sample data file
    const sampleDataPath = path.join(__dirname, 'sample_data.sql');
    const sampleDataSQL = fs.readFileSync(sampleDataPath, 'utf8');

    console.log('\n📝 Loading sample data...');
    console.log('This may take a moment...\n');
    
    await client.query(sampleDataSQL);

    // Verify data was loaded
    console.log('\n✅ Verifying data...');
    const itemsCheck = await client.query('SELECT COUNT(*) FROM items');
    const ratingsCheck = await client.query('SELECT COUNT(*) FROM ratings');
    const likesCheck = await client.query('SELECT COUNT(*) FROM likes');
    const countriesCheck = await client.query(`
      SELECT COUNT(DISTINCT country_id) as countries_with_items 
      FROM items 
      WHERE country_id IS NOT NULL
    `);

    console.log(`✅ Items: ${itemsCheck.rows[0].count} items loaded`);
    console.log(`✅ Ratings: ${ratingsCheck.rows[0].count} ratings loaded`);
    console.log(`✅ Likes: ${likesCheck.rows[0].count} likes loaded`);
    console.log(`✅ Countries with items: ${countriesCheck.rows[0].countries_with_items} countries have items`);

    client.release();
    await pool.end();
    console.log('\n✅ Sample data loaded successfully!');
    console.log('You can now refresh your browser to see the new data.');
  } catch (error) {
    console.error('\n❌ Failed to load sample data:');
    console.error('Error:', error.message);
    if (error.code === '23505') {
      console.error('\n💡 Some items may already exist - this is OK');
    } else {
      console.error('\nStack:', error.stack);
    }
    process.exit(1);
  }
}

loadSampleData();


