// Large dataset seeder for uTweet (Postgres)
// Usage:
//   node database/seed_large_data.js
//   node database/seed_large_data.js --truncate
//   SEED_TOTAL_MULTIPLIER=2 node database/seed_large_data.js
//
// Notes:
// - Generates "plausible" items (not guaranteed real-world URLs).
// - Adds extra density for USA (per-state) and for UK/AU/ZA.

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const DEFAULTS = {
  // Baseline per-country items per category (non-global).
  perCountryPerCategory: 6,
  // Baseline per-category global items (region/country null, is_global true).
  globalPerCategory: 8,
  // Extra per-state items per category for US-only items tagged with 1-3 states.
  perUsStatePerCategory: 3,
  // Boost multipliers for specific countries.
  countryBoosts: {
    US: 3,
    UK: 3,
    AU: 3,
    ZA: 3,
  },
  // Chunk sizes for batching inserts.
  insertChunkSize: 200,
};

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function clampInt(n, min, max) {
  const x = Number.isFinite(n) ? Math.trunc(n) : min;
  return Math.max(min, Math.min(max, x));
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function sampleDistinct(rng, arr, count) {
  const n = Math.min(count, arr.length);
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function makeFakeUrl({ countryCode, categorySlug, stateCode, idSuffix }) {
  // Keep stable-ish, unique URLs so reruns can be truncated/reseeded cleanly.
  // Use an intentionally non-resolvable domain.
  const parts = ['https://birding.local', countryCode || 'global', categorySlug];
  if (stateCode) parts.push(stateCode.toLowerCase());
  parts.push(String(idSuffix));
  return parts.join('/');
}

function buildItemText(rng, { countryName, countryCode, categoryName, categorySlug, stateCode }) {
  const adjectives = ['Local', 'Official', 'Trusted', 'Community', 'Field', 'Wildlife', 'Conservation', 'Birding', 'Nature', 'Coastal', 'Highland', 'Wetland', 'Forest', 'Prairie', 'Desert', 'Mountain'];
  const nouns = ['Birding Guide', 'Hotspot Directory', 'Bird Club', 'Nature Reserve', 'Wildlife Park', 'Photo Blog', 'Events Calendar', 'Conservation Network', 'Migration Watch', 'Rare Bird Alerts', 'Trip Planner', 'Optics Shop', 'Field Notes', 'Trail Map', 'Observation Log'];
  const verbs = ['Explore', 'Discover', 'Plan', 'Track', 'Learn', 'Find', 'Share', 'Support', 'Spot', 'Photograph'];

  const geo = stateCode ? `${stateCode}, United States` : (countryName || countryCode || 'Worldwide');
  const titleCore = `${pick(rng, adjectives)} ${pick(rng, nouns)}`;
  const title = stateCode ? `${titleCore} (${stateCode})` : `${titleCore} - ${geo}`;
  const description = `${pick(rng, verbs)} ${categoryName || categorySlug} resources for birders in ${geo}. Check seasonal highlights, key habitats, and local conservation updates.`;

  // Very lightweight, category-anchored image placeholders.
  const imagePool = [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=800',
    'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800',
    'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=800',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
    'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=800',
    'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800',
  ];

  const image_url = pick(rng, imagePool);
  return { title, description, image_url };
}

async function ensureUsStatesTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS item_us_states (
      item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
      state_code VARCHAR(2) NOT NULL,
      PRIMARY KEY (item_id, state_code)
    );
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_item_us_states_item ON item_us_states(item_id);`);
}

function parseEnvNumber(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

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

async function seedLargeData() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const shouldTruncate = process.argv.includes('--truncate');
  const totalMultiplier = clampInt(parseEnvNumber('SEED_TOTAL_MULTIPLIER', 1), 1, 25);

  const cfg = {
    ...DEFAULTS,
    perCountryPerCategory: clampInt(DEFAULTS.perCountryPerCategory * totalMultiplier, 1, 500),
    globalPerCategory: clampInt(DEFAULTS.globalPerCategory * totalMultiplier, 1, 500),
    perUsStatePerCategory: clampInt(DEFAULTS.perUsStatePerCategory * totalMultiplier, 0, 200),
  };

  console.log('🔌 Connecting to database...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslForDatabaseUrl(process.env.DATABASE_URL),
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureUsStatesTable(client);

    if (shouldTruncate) {
      console.log('🧹 Truncating existing seeded content...');
      // Keep categories/countries/regions/admin_users intact.
      await client.query('TRUNCATE TABLE item_us_states, ratings, likes, items RESTART IDENTITY CASCADE;');
    }

    const categories = (await client.query('SELECT id, name, slug FROM categories ORDER BY id')).rows;
    const countries = (await client.query(`
      SELECT c.id, c.name, c.code, c.region_id, r.code AS region_code
      FROM countries c
      JOIN regions r ON r.id = c.region_id
      ORDER BY c.code
    `)).rows;
    const regions = (await client.query('SELECT id, code FROM regions')).rows;
    const regionIdByCode = new Map(regions.map(r => [r.code, r.id]));

    if (categories.length === 0) throw new Error('No categories found. Run database/schema.sql first.');
    if (countries.length === 0) throw new Error('No countries found. Run database/schema.sql first.');

    const categoryBySlug = new Map(categories.map(c => [c.slug, c]));

    // Heuristic: "websites-global" is global-only; other categories can have both.
    const globalOnlySlugs = new Set(['websites-global']);

    const rng = mulberry32(0xC0FFEE);

    const itemsToInsert = [];
    const usStateLinks = []; // { itemIndex, states: [] }

    let globalCounter = 0;
    for (const cat of categories) {
      const globalCount = globalOnlySlugs.has(cat.slug) ? Math.max(cfg.globalPerCategory, 20) : cfg.globalPerCategory;
      for (let i = 0; i < globalCount; i++) {
        globalCounter++;
        const { title, description, image_url } = buildItemText(rng, {
          countryName: 'Worldwide',
          countryCode: null,
          categoryName: cat.name,
          categorySlug: cat.slug,
          stateCode: null,
        });
        itemsToInsert.push({
          title: `${title} #${globalCounter}`,
          description,
          url: makeFakeUrl({ countryCode: null, categorySlug: cat.slug, stateCode: null, idSuffix: `g${globalCounter}` }),
          category_id: cat.id,
          region_id: null,
          country_id: null,
          is_global: true,
          image_url,
        });
      }
    }

    let countryCounter = 0;
    for (const country of countries) {
      const boost = cfg.countryBoosts[country.code] || 1;
      for (const cat of categories) {
        if (globalOnlySlugs.has(cat.slug)) continue;
        const count = cfg.perCountryPerCategory * boost;
        for (let i = 0; i < count; i++) {
          countryCounter++;
          const { title, description, image_url } = buildItemText(rng, {
            countryName: country.name,
            countryCode: country.code,
            categoryName: cat.name,
            categorySlug: cat.slug,
            stateCode: null,
          });
          itemsToInsert.push({
            title: `${title} #${countryCounter}`,
            description,
            url: makeFakeUrl({ countryCode: country.code, categorySlug: cat.slug, stateCode: null, idSuffix: countryCounter }),
            category_id: cat.id,
            region_id: regionIdByCode.get(country.region_code) || country.region_id || null,
            country_id: country.id,
            is_global: false,
            image_url,
          });
        }
      }
    }

    // USA per-state boost: create US items that are tagged to 1-3 specific states.
    const us = countries.find(c => c.code === 'US');
    if (us && cfg.perUsStatePerCategory > 0) {
      let usStateCounter = 0;
      for (const cat of categories) {
        if (globalOnlySlugs.has(cat.slug)) continue;
        for (const state of US_STATES) {
          for (let i = 0; i < cfg.perUsStatePerCategory; i++) {
            usStateCounter++;
            const statesForItem = sampleDistinct(rng, US_STATES, 1 + Math.floor(rng() * 3));
            const primaryState = pick(rng, statesForItem);
            const { title, description, image_url } = buildItemText(rng, {
              countryName: us.name,
              countryCode: us.code,
              categoryName: cat.name,
              categorySlug: cat.slug,
              stateCode: primaryState,
            });

            const itemIndex = itemsToInsert.length;
            itemsToInsert.push({
              title: `${title} - ${cat.name} #${usStateCounter}`,
              description,
              url: makeFakeUrl({ countryCode: 'US', categorySlug: cat.slug, stateCode: primaryState, idSuffix: `s${usStateCounter}` }),
              category_id: cat.id,
              region_id: regionIdByCode.get(us.region_code) || us.region_id || null,
              country_id: us.id,
              is_global: false,
              image_url,
            });
            usStateLinks.push({ itemIndex, states: statesForItem });
          }
        }
      }
    }

    console.log(`🧪 Prepared ${itemsToInsert.length.toLocaleString()} items to insert...`);

    const insertedItemIds = new Array(itemsToInsert.length);

    // Insert items in chunks.
    for (let start = 0; start < itemsToInsert.length; start += cfg.insertChunkSize) {
      const chunk = itemsToInsert.slice(start, start + cfg.insertChunkSize);

      const cols = ['title','description','url','category_id','region_id','country_id','is_global','image_url'];
      const values = [];
      const params = [];
      let p = 1;

      for (const row of chunk) {
        values.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
        params.push(
          row.title,
          row.description || null,
          row.url || null,
          row.category_id,
          row.region_id || null,
          row.country_id || null,
          !!row.is_global,
          row.image_url || null
        );
      }

      const q = `
        INSERT INTO items (${cols.join(', ')})
        VALUES ${values.join(', ')}
        RETURNING id
      `;

      const res = await client.query(q, params);
      for (let i = 0; i < res.rows.length; i++) {
        insertedItemIds[start + i] = res.rows[i].id;
      }
    }

    // Build item_us_states rows for US state-targeted items
    const junctionRows = [];
    for (const link of usStateLinks) {
      const itemId = insertedItemIds[link.itemIndex];
      if (!itemId) continue;
      for (const state of link.states) {
        junctionRows.push([itemId, state]);
      }
    }

    if (junctionRows.length > 0) {
      console.log(`🧩 Linking ${junctionRows.length.toLocaleString()} item↔state rows...`);
      const junctionChunk = 500;
      for (let start = 0; start < junctionRows.length; start += junctionChunk) {
        const chunk = junctionRows.slice(start, start + junctionChunk);
        const values = [];
        const params = [];
        let p = 1;
        for (const [itemId, state] of chunk) {
          values.push(`($${p++}, $${p++})`);
          params.push(itemId, state);
        }
        await client.query(
          `INSERT INTO item_us_states (item_id, state_code)
           VALUES ${values.join(', ')}
           ON CONFLICT (item_id, state_code) DO NOTHING`,
          params
        );
      }
    }

    await client.query('COMMIT');

    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM items) AS items,
        (SELECT COUNT(*) FROM item_us_states) AS item_us_states
    `);

    console.log('✅ Done.');
    console.log(`✅ Items: ${counts.rows[0].items}`);
    console.log(`✅ item_us_states rows: ${counts.rows[0].item_us_states}`);
    console.log('\nTip: run with --truncate to reseed from scratch.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', e?.message || e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedLargeData();

