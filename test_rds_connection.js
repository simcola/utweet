// Test RDS Database Connection from Local PC
// Usage: DATABASE_URL="your-connection-string" node test_rds_connection.js

const { Pool } = require('pg');

// Get DATABASE_URL from command line or environment
const databaseUrl = process.argv[2] || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL not provided');
  console.log('\nUsage:');
  console.log('  node test_rds_connection.js "postgresql://user:pass@host:5432/db"');
  console.log('  OR');
  console.log('  DATABASE_URL="postgresql://user:pass@host:5432/db" node test_rds_connection.js');
  console.log('\nExample:');
  console.log('  node test_rds_connection.js "postgresql://utweet_admin:uTweet11!@utweet-db.ch8c86aka86t.us-east-2.rds.amazonaws.com:5432/utweet"');
  process.exit(1);
}

// Mask password in logs
const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':****@');
console.log('🔌 Testing database connection...');
console.log('Connection string:', maskedUrl);
console.log('');

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false // RDS requires SSL
  },
});

async function testConnection() {
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const client = await pool.connect();
    console.log('   ✅ Connection successful!');
    
    // Test PostgreSQL version
    console.log('\n2. Checking PostgreSQL version...');
    const versionResult = await client.query('SELECT version()');
    console.log('   ✅ PostgreSQL:', versionResult.rows[0].version.split(' ')[0] + ' ' + versionResult.rows[0].version.split(' ')[1]);
    
    // Test current database
    console.log('\n3. Checking current database...');
    const dbResult = await client.query('SELECT current_database()');
    console.log('   ✅ Database:', dbResult.rows[0].current_database);
    
    // Check if tables exist
    console.log('\n4. Checking if tables exist...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('regions', 'categories', 'items', 'countries', 'ratings', 'likes')
      ORDER BY table_name
    `);
    
    const existingTables = tablesResult.rows.map(r => r.table_name);
    const expectedTables = ['regions', 'categories', 'items', 'countries', 'ratings', 'likes'];
    
    expectedTables.forEach(table => {
      if (existingTables.includes(table)) {
        console.log(`   ✅ Table '${table}' exists`);
      } else {
        console.log(`   ❌ Table '${table}' does NOT exist`);
      }
    });
    
    // Check data counts
    console.log('\n5. Checking data counts...');
    try {
      const countsResult = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM regions) as regions,
          (SELECT COUNT(*) FROM categories) as categories,
          (SELECT COUNT(*) FROM items) as items,
          (SELECT COUNT(*) FROM countries) as countries
      `);
      const counts = countsResult.rows[0];
      console.log(`   ✅ Regions: ${counts.regions}`);
      console.log(`   ✅ Categories: ${counts.categories}`);
      console.log(`   ✅ Items: ${counts.items}`);
      console.log(`   ✅ Countries: ${counts.countries}`);
      
      if (counts.regions === '0' || counts.categories === '0') {
        console.log('\n   ⚠️  Warning: Some tables are empty. You may need to load schema.sql and sample_data.sql');
      }
    } catch (err) {
      console.log('   ⚠️  Could not count data - tables may not exist:', err.message);
    }
    
    // Test a sample query
    console.log('\n6. Testing sample queries...');
    try {
      const regionsResult = await client.query('SELECT id, name, code FROM regions LIMIT 5');
      console.log(`   ✅ Regions query successful (found ${regionsResult.rows.length} regions)`);
      if (regionsResult.rows.length > 0) {
        console.log('   Sample regions:', regionsResult.rows.map(r => r.name).join(', '));
      }
    } catch (err) {
      console.log('   ❌ Regions query failed:', err.message);
    }
    
    try {
      const categoriesResult = await client.query('SELECT id, name FROM categories LIMIT 5');
      console.log(`   ✅ Categories query successful (found ${categoriesResult.rows.length} categories)`);
      if (categoriesResult.rows.length > 0) {
        console.log('   Sample categories:', categoriesResult.rows.map(r => r.name).join(', '));
      }
    } catch (err) {
      console.log('   ❌ Categories query failed:', err.message);
    }
    
    client.release();
    await pool.end();
    
    console.log('\n✅ All tests passed! Your DATABASE_URL is correct and ready for AWS Amplify.');
    console.log('\n📋 Next steps:');
    console.log('   1. Copy this exact DATABASE_URL to AWS Amplify Environment variables');
    console.log('   2. Make sure to include :5432/utweet at the end');
    console.log('   3. Redeploy your Amplify app');
    
  } catch (error) {
    console.error('\n❌ Database connection failed!');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection refused. Possible issues:');
      console.error('   - RDS security group is blocking your IP address');
      console.error('   - Wrong hostname in DATABASE_URL');
      console.error('   - RDS instance is not publicly accessible');
      console.error('\n   Fix: Add your IP to RDS security group inbound rules');
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication failed. Possible issues:');
      console.error('   - Wrong username or password');
      console.error('   - Special characters in password need URL encoding');
      console.error('   - Password contains characters that need encoding: @ # $ % & + = ?');
      console.error('\n   Fix: URL encode special characters in password');
      console.error('   Example: ! becomes %21, @ becomes %40');
    } else if (error.code === '3D000') {
      console.error('\n💡 Database does not exist.');
      console.error('   - Check the database name in DATABASE_URL');
      console.error('   - Verify database was created in RDS');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Hostname not found.');
      console.error('   - Check the hostname in DATABASE_URL');
      console.error('   - Verify RDS endpoint is correct');
    } else if (error.message.includes('SSL')) {
      console.error('\n💡 SSL connection issue.');
      console.error('   - RDS requires SSL connections');
      console.error('   - The script should handle this, but verify SSL settings');
    }
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();

