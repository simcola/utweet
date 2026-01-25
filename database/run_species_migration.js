// Run migration to add species and airesponse columns to photos table
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Running migration: Add species and airesponse columns...');
    
    await client.query('BEGIN');
    
    // Add columns
    await client.query(`
      ALTER TABLE photos 
      ADD COLUMN IF NOT EXISTS species VARCHAR(255),
      ADD COLUMN IF NOT EXISTS airesponse TEXT
    `);
    
    // Add index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_photos_species 
      ON photos(species) 
      WHERE species IS NOT NULL
    `);
    
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();

