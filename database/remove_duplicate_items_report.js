// Quick report: logical duplicates (same category + placement + title).
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

function sslForDatabaseUrl(databaseUrl) {
  try {
    const u = new URL(databaseUrl);
    const h = (u.hostname || '').toLowerCase();
    if (h === 'localhost' || h === '127.0.0.1' || h === '::1') return false;
    return { rejectUnauthorized: false };
  } catch {
    return false;
  }
}

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslForDatabaseUrl(process.env.DATABASE_URL),
  });
  const r = await pool.query(`
    SELECT COUNT(*)::int AS extra_rows FROM (
      SELECT id FROM (
        SELECT id,
          ROW_NUMBER() OVER (
            PARTITION BY category_id, COALESCE(region_id, -1), COALESCE(country_id, -1), is_global,
              LOWER(TRIM(BOTH FROM title))
            ORDER BY id
          ) AS rn
        FROM items
      ) x WHERE rn > 1
    ) y
  `);
  console.log('Extra rows with duplicate title+placement:', r.rows[0].extra_rows);
  await pool.end();
})();
