// Remove duplicate rows from `items`, keeping the lowest `id` per duplicate group.
//
// Default: duplicate key = LOWER(TRIM(url)) for rows with a non-empty URL.
// Optional: --also-empty-url duplicates by title + category_id + region_id + country_id + is_global.
//
// Usage:
//   node database/remove_duplicate_items.js --dry-run
//   node database/remove_duplicate_items.js
//   node database/remove_duplicate_items.js --also-empty-url

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

function sslForDatabaseUrl(databaseUrl) {
  try {
    const u = new URL(databaseUrl);
    const host = (u.hostname || '').toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (isLocal) return false;
    return { rejectUnauthorized: false };
  } catch {
    return process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const dryRun = process.argv.includes('--dry-run');
  const alsoEmpty = process.argv.includes('--also-empty-url');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslForDatabaseUrl(process.env.DATABASE_URL),
  });

  const client = await pool.connect();
  try {
    const before = await client.query('SELECT COUNT(*)::int AS c FROM items');
    console.log(`📦 Items before: ${before.rows[0].c}`);

    // Normalize URLs so https://x/y and http://x/y/ collapse together.
    const urlNormExpr = `
      LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(TRIM(BOTH FROM url), '/+$', ''),
          '^http://',
          'https://'
        )
      )
    `;

    const urlDupes = await client.query(`
      SELECT COUNT(*)::int AS n
      FROM (
        SELECT id FROM (
          SELECT id,
            ROW_NUMBER() OVER (
              PARTITION BY ${urlNormExpr.replace(/\s+/g, ' ')}
              ORDER BY id
            ) AS rn
          FROM items
          WHERE url IS NOT NULL AND TRIM(BOTH FROM url) <> ''
        ) x WHERE rn > 1
      ) d
    `);
    console.log(`🔁 Duplicate rows by URL (would delete): ${urlDupes.rows[0].n}`);

    let emptyDupes = { rows: [{ n: 0 }] };
    if (alsoEmpty) {
      emptyDupes = await client.query(`
        SELECT COUNT(*)::int AS n
        FROM (
          SELECT id FROM (
            SELECT id,
              ROW_NUMBER() OVER (
                PARTITION BY LOWER(TRIM(title)), category_id, COALESCE(region_id, -1), COALESCE(country_id, -1), is_global
                ORDER BY id
              ) AS rn
            FROM items
            WHERE url IS NULL OR TRIM(url) = ''
          ) x WHERE rn > 1
        ) d
      `);
      console.log(`🔁 Duplicate rows with empty URL (would delete): ${emptyDupes.rows[0].n}`);
    }

    if (dryRun) {
      console.log('\n💡 Dry run — no changes made. Omit --dry-run to delete.');
      return;
    }

    await client.query('BEGIN');

    const delUrl = await client.query(`
      DELETE FROM items
      WHERE id IN (
        SELECT id FROM (
          SELECT id,
            ROW_NUMBER() OVER (
              PARTITION BY ${urlNormExpr.replace(/\s+/g, ' ')}
              ORDER BY id
            ) AS rn
          FROM items
          WHERE url IS NOT NULL AND TRIM(BOTH FROM url) <> ''
        ) sub
        WHERE rn > 1
      )
    `);
    console.log(`🗑️  Deleted by duplicate URL: ${delUrl.rowCount}`);

    let delEmpty = { rowCount: 0 };
    if (alsoEmpty) {
      delEmpty = await client.query(`
        DELETE FROM items
        WHERE id IN (
          SELECT id FROM (
            SELECT id,
              ROW_NUMBER() OVER (
                PARTITION BY LOWER(TRIM(title)), category_id, COALESCE(region_id, -1), COALESCE(country_id, -1), is_global
                ORDER BY id
              ) AS rn
            FROM items
            WHERE url IS NULL OR TRIM(url) = ''
          ) sub
          WHERE rn > 1
        )
      `);
      console.log(`🗑️  Deleted by duplicate empty-URL fingerprint: ${delEmpty.rowCount}`);
    }

    await client.query('COMMIT');

    const after = await client.query('SELECT COUNT(*)::int AS c FROM items');
    console.log(`📦 Items after: ${after.rows[0].c}`);
    console.log('✅ Done (ratings/likes/state links for removed rows cascade-delete).');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Failed:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
