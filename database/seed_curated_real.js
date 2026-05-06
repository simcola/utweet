// Seed curated REAL links (no scraping).
// - Inserts a curated list of authoritative URLs + generates per-state USA eBird region pages.
// - Idempotent: skips items whose `url` already exists.
//
// Usage:
//   node database/seed_curated_real.js
//   node database/seed_curated_real.js --truncate
//
// Optional env:
//   CURATED_INCLUDE_US_STATE_EBIRD=1 (default 1)
//   CURATED_INCLUDE_EXTRA_US_STATE_HOTSPOTS=0 (default 0) -> adds /hotspots pages too

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

/** States that get extra curated regional sites + Macaulay Library (10+ regional web resources total). */
const BIG_STATE_CODES = new Set([
  'CA',
  'TX',
  'FL',
  'NY',
  'PA',
  'IL',
  'OH',
  'GA',
  'NC',
  'MI',
  'NJ',
  'WA',
  'AZ',
  'VA',
  'MA',
  'TN',
]);

/** Four additional curated birding org URLs per big state (real sites). */
const BIG_STATE_REGIONAL_SITES = {
  CA: [
    { title: 'Audubon California', description: 'State Audubon field program for California.', url: 'https://ca.audubon.org/' },
    { title: 'Golden Gate Bird Alliance', description: 'Bay Area bird conservation and outings.', url: 'https://goldengatebirdalliance.org/' },
    { title: 'Los Angeles Audubon Society', description: 'Los Angeles chapter programs and birding resources.', url: 'https://www.laaudubon.org/' },
    { title: 'Sea & Sage Audubon Society', description: 'Orange County Audubon chapter.', url: 'https://www.seaandsageaudubon.org/' },
  ],
  TX: [
    { title: 'Audubon Texas', description: 'State Audubon program for Texas.', url: 'https://tx.audubon.org/' },
    { title: 'Houston Audubon', description: 'Gulf Coast sanctuaries, trips, and conservation.', url: 'https://www.houstonaudubon.org/' },
    { title: 'Travis Audubon', description: 'Central Texas chapter: trips, sanctuaries, classes.', url: 'https://www.travisaudubon.org/' },
    { title: 'Audubon Dallas', description: 'North Texas chapter and Cedar Ridge Preserve.', url: 'https://www.audubondallas.org/' },
  ],
  FL: [
    { title: 'Audubon Florida', description: 'State Audubon program for Florida.', url: 'https://www.audubon.org/florida' },
    { title: 'Corkscrew Swamp Sanctuary (Audubon)', description: 'Corkscrew visitor information and conservation.', url: 'https://corkscrew.audubon.org/' },
    { title: 'Tropical Audubon Society', description: 'South Florida chapter (Miami-Dade / Monroe).', url: 'https://www.tropicalaudubon.org/' },
    { title: 'Orange Audubon Society', description: 'Central Florida chapter birding resources.', url: 'https://www.orangeaudubonfl.org/' },
  ],
  NY: [
    { title: 'Audubon New York', description: 'State Audubon office for New York.', url: 'https://ny.audubon.org/' },
    { title: 'NYC Bird Alliance', description: 'New York City bird outings and conservation.', url: 'https://www.nycbirdalliance.org/' },
    { title: 'Buffalo Audubon', description: 'Western New York preserves and programs.', url: 'https://buffaloaudubon.org/' },
    { title: 'Genesee Valley Audubon Society', description: 'Greater Rochester birding chapter.', url: 'https://www.gvaudubon.org/' },
  ],
  PA: [
    { title: 'Audubon Mid-Atlantic (Pennsylvania)', description: 'Regional Audubon office serving Pennsylvania.', url: 'https://pa.audubon.org/' },
    { title: 'Audubon Society of Western Pennsylvania', description: 'Pittsburgh-area chapter and nature reserves.', url: 'https://www.aswp.org/' },
    { title: 'Valley Forge Audubon Society', description: 'Southeastern PA chapter programs.', url: 'https://valleyforgeaudubon.org/' },
    { title: 'Liberty Bird Alliance', description: 'Philadelphia / Montgomery Counties chapter (formerly Wyncote Audubon).', url: 'https://www.wyncoteaudubon.org/' },
  ],
  IL: [
    { title: 'Illinois Audubon Society', description: 'Illinois land trust and conservation outings.', url: 'https://illinoisaudubon.org/' },
    { title: 'Chicago Bird Alliance', description: 'Chicago-area Audubon chapter.', url: 'https://www.chicagobirdalliance.org/' },
    { title: 'Audubon Council of Illinois', description: 'Coalition of Illinois Audubon chapters.', url: 'https://www.auduboncil.org/' },
    { title: 'Peoria Audubon Society', description: 'Central Illinois Audubon chapter.', url: 'https://peoriaaudubon.org/' },
  ],
  OH: [
    { title: 'Council of Ohio Audubon Chapters', description: 'Network of Ohio Audubon chapters.', url: 'https://www.counciloac.org/' },
    { title: 'Black Swamp Bird Observatory', description: 'Lake Erie migrant research and Biggest Week.', url: 'https://www.bsbo.org/' },
    { title: 'Columbus Audubon', description: 'Central Ohio chapter trips and programs.', url: 'https://columbusaudubon.org/' },
    { title: 'Western Cuyahoga Audubon', description: 'Greater Cleveland west-side chapter.', url: 'https://www.wcaudubon.org/' },
  ],
  GA: [
    { title: 'Birds Georgia', description: 'Statewide conservation, trips, and Atlanta programs.', url: 'https://www.birdsgeorgia.org/' },
    { title: 'Georgia Ornithological Society', description: 'Georgia bird records and meetings.', url: 'https://gos.org/' },
    { title: 'Atlanta Audubon Society', description: 'Redirects to Birds Georgia regional hub.', url: 'https://atlantaaudubon.org/' },
    { title: 'Oconee Rivers Audubon Society', description: 'Athens-area Audubon chapter.', url: 'https://oconeeriversaudubon.org/' },
  ],
  NC: [
    { title: 'Audubon North Carolina', description: 'State Audubon program for North Carolina.', url: 'https://www.ncaudubon.org/' },
    { title: 'Carolina Bird Club', description: 'Regional club meetings and field trips.', url: 'https://www.carolinabirdclub.org/' },
    { title: 'New Hope Audubon Society', description: 'Triangle-area chapter.', url: 'https://newhopeaudubon.org/' },
    { title: 'Blue Ridge Audubon', description: 'Western NC chapter (Asheville / Beaver Lake Bird Sanctuary).', url: 'https://blueridgeaudubon.org/' },
  ],
  MI: [
    { title: 'Michigan Audubon', description: 'Statewide Audubon sanctuaries and programs.', url: 'https://www.michiganaudubon.org/' },
    { title: 'Whitefish Point Bird Observatory', description: 'Lake Superior migration monitoring.', url: 'https://www.wpbo.org/' },
    { title: 'Detroit Bird Alliance', description: 'Southeast Michigan birding and conservation.', url: 'https://www.detroitbirdalliance.org/' },
    { title: 'Washtenaw Bird and Nature Alliance', description: 'Ann Arbor area chapter.', url: 'https://washtenawaudubon.org/' },
  ],
  NJ: [
    { title: 'New Jersey Audubon', description: 'Statewide conservation, centers, and trips.', url: 'https://www.njaudubon.org/' },
    { title: 'Cape May Bird Observatory', description: 'Migration hotspot programs (NJ Audubon).', url: 'https://www.birdcapemay.org/' },
    { title: 'Atlantic Audubon Society', description: 'South Jersey chapter and locale guides.', url: 'https://www.atlanticaudubon.org/' },
    { title: 'Bergen County Audubon Society', description: 'Northern NJ chapter outings.', url: 'https://www.bergencountyaudubon.org/' },
  ],
  WA: [
    { title: 'Audubon Washington', description: 'State Audubon office for Washington.', url: 'https://wa.audubon.org/' },
    { title: 'Birds Connect Seattle', description: 'Seattle-area conservation and bird walks.', url: 'https://birdsconnectsea.org/' },
    { title: 'Puget Sound Bird Observatory', description: 'Puget Sound bird research and community science.', url: 'https://www.pugetsoundbirds.org/' },
    { title: 'Spokane Audubon Society', description: 'Inland Northwest chapter.', url: 'https://www.audubonspokane.org/' },
  ],
  AZ: [
    { title: 'Audubon Southwest', description: 'Regional Audubon hub for Arizona.', url: 'https://az.audubon.org/' },
    { title: 'Tucson Bird Alliance', description: 'Southeast Arizona birding chapter.', url: 'https://www.tucsonbirds.org/' },
    { title: 'Maricopa Bird Alliance', description: 'Greater Phoenix chapter.', url: 'https://maricopabirdalliance.org/' },
    { title: 'Nina Mason Pulliam Rio Salado Audubon Center', description: 'Phoenix Audubon center on the Salt River.', url: 'https://riosalado.audubon.org/' },
  ],
  VA: [
    { title: 'Virginia Society of Ornithology', description: 'Virginia bird records, journals, and meetings.', url: 'https://www.virginiabirds.org/' },
    { title: 'Virginia Bird Atlas', description: 'Breeding bird atlas for Virginia.', url: 'https://vabirdatlas.org/' },
    { title: 'Northern Virginia Bird Alliance', description: 'Northern Virginia Audubon chapter.', url: 'https://www.audubonva.org/' },
    { title: 'Richmond Audubon Society', description: 'Central Virginia chapter.', url: 'https://richmondaudubon.org/' },
  ],
  MA: [
    { title: 'Mass Audubon', description: 'Massachusetts sanctuaries and programs.', url: 'https://www.massaudubon.org/' },
    { title: 'Brookline Bird Club', description: 'Active Massachusetts birding trips club.', url: 'https://www.brooklinebirdclub.org/' },
    { title: 'MassBird', description: 'Massachusetts birding hub and listserv info.', url: 'https://massbird.org/' },
    { title: 'Cape Cod Bird Club', description: 'Cape Cod birding and conservation.', url: 'https://www.capecodbirdclub.org/' },
  ],
  TN: [
    { title: 'Tennessee Ornithological Society', description: 'State ornithological society and chapters.', url: 'https://www.tnbirds.org/' },
    { title: 'Chattanooga Audubon Society', description: 'Chattanooga-area sanctuaries and programs.', url: 'https://www.chattanoogaaudubon.org/' },
    { title: 'Nashville Urban Bird City', description: 'Nashville urban bird conservation hub.', url: 'https://nashvilleurbanbirdcity.org/' },
    { title: 'Bird Safe Nashville', description: 'Lights Out and collision reduction in Nashville.', url: 'https://www.birdsafenashville.org/' },
  ],
};

function envFlag(name, defaultValue) {
  const v = process.env[name];
  if (v == null) return defaultValue;
  return v === '1' || v.toLowerCase() === 'true' || v.toLowerCase() === 'yes';
}

function sslForDatabaseUrl(databaseUrl) {
  // Many hosted Postgres providers (incl. RDS) require SSL.
  // For localhost dev, SSL usually isn't needed.
  try {
    const u = new URL(databaseUrl);
    const host = (u.hostname || '').toLowerCase();
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (isLocal) return false;
    return { rejectUnauthorized: false };
  } catch {
    // Fallback: preserve prior behavior.
    return process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
  }
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

function curatedItems() {
  // Keep descriptions short and original (not copied from websites).
  /** @type {Array<{category_slug:string, region_code?:string|null, country_code?:string|null, is_global?:boolean, title:string, description?:string, url:string, image_url?:string|null, us_states?:string[]}>} */
  const items = [
    // Global
    {
      category_slug: 'websites-global',
      is_global: true,
      title: 'eBird (Cornell Lab)',
      description: 'Global bird observations, hotspots, checklists, and mapping.',
      url: 'https://ebird.org/',
    },
    {
      category_slug: 'websites-global',
      is_global: true,
      title: 'BirdLife International',
      description: 'Global bird conservation partnership and resources.',
      url: 'https://www.birdlife.org/',
    },
    {
      category_slug: 'websites-global',
      is_global: true,
      title: 'iNaturalist',
      description: 'Community biodiversity observations (birds included).',
      url: 'https://www.inaturalist.org/',
    },
    {
      category_slug: 'websites-global',
      is_global: true,
      title: 'Macaulay Library',
      description: 'Media archive for wildlife photos and audio (Cornell).',
      url: 'https://www.macaulaylibrary.org/',
    },

    // UK (country_code UK)
    {
      category_slug: 'websites-regional',
      region_code: 'EU',
      country_code: 'UK',
      title: 'RSPB',
      description: 'UK bird conservation charity with reserves and guidance.',
      url: 'https://www.rspb.org.uk/',
    },
    {
      category_slug: 'websites-regional',
      region_code: 'EU',
      country_code: 'UK',
      title: 'BTO (British Trust for Ornithology)',
      description: 'Science and monitoring for UK birds (surveys, atlases).',
      url: 'https://www.bto.org/',
    },
    {
      category_slug: 'news',
      is_global: true,
      title: 'BirdGuides',
      description: 'Birding news and sightings (UK-focused).',
      url: 'https://www.birdguides.com/',
    },
    {
      category_slug: 'websites-regional',
      region_code: 'EU',
      country_code: 'UK',
      title: 'eBird United Kingdom (Great Britain region)',
      description: 'UK region portal in eBird (GB region code).',
      url: 'https://ebird.org/region/GB',
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'EU',
      country_code: 'UK',
      title: 'eBird Hotspots: United Kingdom (GB)',
      description: 'Hotspots listing for Great Britain in eBird.',
      url: 'https://ebird.org/region/GB/hotspots',
    },
    {
      category_slug: 'news',
      region_code: 'EU',
      country_code: 'UK',
      title: 'eBird Recent Checklists: United Kingdom (GB)',
      description: 'Recent birding checklists for Great Britain in eBird.',
      url: 'https://ebird.org/region/GB/recent-checklists',
    },

    // Australia (country_code AU)
    {
      category_slug: 'websites-regional',
      region_code: 'AO',
      country_code: 'AU',
      title: 'BirdLife Australia',
      description: 'Australian bird conservation and programs.',
      url: 'https://www.birdlife.org.au/',
    },
    {
      category_slug: 'websites-regional',
      region_code: 'AO',
      country_code: 'AU',
      title: 'eBird Australia',
      description: 'Australian region portal in eBird.',
      url: 'https://ebird.org/region/AU',
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'AO',
      country_code: 'AU',
      title: 'eBird Hotspots: Australia',
      description: 'Hotspots listing for Australia in eBird.',
      url: 'https://ebird.org/region/AU/hotspots',
    },
    {
      category_slug: 'news',
      region_code: 'AO',
      country_code: 'AU',
      title: 'eBird Recent Checklists: Australia',
      description: 'Recent birding checklists for Australia in eBird.',
      url: 'https://ebird.org/region/AU/recent-checklists',
    },

    // South Africa (country_code ZA)
    {
      category_slug: 'websites-regional',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'BirdLife South Africa',
      description: 'South African bird conservation organization.',
      url: 'https://www.birdlife.org.za/',
    },
    {
      category_slug: 'websites-regional',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'SABAP2 (Southern African Bird Atlas Project)',
      description: 'Atlas project and mapping portal for southern African birds.',
      url: 'https://sabap2.birdmap.africa/',
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'SANParks',
      description: 'South African National Parks (parks and planning info).',
      url: 'https://www.sanparks.org/',
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'Kruger National Park (SANParks)',
      description: 'Planning, gates, camps, and activities.',
      url: 'https://www.sanparks.org/parks/kruger',
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'Addo Elephant National Park (SANParks)',
      description: 'Eastern Cape park information and travel planning.',
      url: 'https://www.sanparks.org/parks/addo-elephant',
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'Table Mountain National Park (SANParks)',
      description: 'Cape Town park info, gates, maps, and activities.',
      url: 'https://www.sanparks.org/parks/table-mountain',
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'Garden Route National Park (SANParks)',
      description: 'Park overview, trails, and visitor planning.',
      url: 'https://www.sanparks.org/parks/garden-route',
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'West Coast National Park (SANParks)',
      description: 'Coastal lagoon habitats and visitor info.',
      url: 'https://www.sanparks.org/parks/west-coast',
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'Mokala National Park (SANParks)',
      description: 'Park overview and visitor information.',
      url: 'https://www.sanparks.org/parks/mokala',
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'Kgalagadi Transfrontier Park (SANParks)',
      description: 'Kalahari park info and travel planning.',
      url: 'https://www.sanparks.org/parks/kgalagadi',
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'iSimangaliso Wetland Park (Official)',
      description: 'UNESCO World Heritage wetland park visitor info.',
      url: 'https://www.isimangaliso.com/index.php',
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'CapeNature Reserves',
      description: 'Western Cape reserves network and visitor info.',
      url: 'https://www.capenature.co.za/reserves',
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'SANBI',
      description: 'South African National Biodiversity Institute (gardens, biodiversity).',
      url: 'https://www.sanbi.org/',
    },
    {
      category_slug: 'travel-tour-operators',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'Rockjumper Birding Tours',
      description: 'Guided birding tours (South Africa-based operator).',
      url: 'https://www.rockjumper.com/',
    },
    {
      category_slug: 'travel-tour-operators',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'Birding Africa',
      description: 'Africa-focused birding tours (based in South Africa).',
      url: 'https://www.birdingafrica.com/',
    },
    {
      category_slug: 'travel-tour-operators',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'Birding Ecotours',
      description: 'Small-group birding tours (incl. South Africa itineraries).',
      url: 'https://www.birdingecotours.com/',
    },
    {
      category_slug: 'websites-regional',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'eBird South Africa',
      description: 'South Africa region portal in eBird.',
      url: 'https://ebird.org/region/ZA',
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'eBird Hotspots: South Africa',
      description: 'Hotspots listing for South Africa in eBird.',
      url: 'https://ebird.org/region/ZA/hotspots',
    },
    {
      category_slug: 'news',
      region_code: 'AF',
      country_code: 'ZA',
      title: 'eBird Recent Checklists: South Africa',
      description: 'Recent birding checklists for South Africa in eBird.',
      url: 'https://ebird.org/region/ZA/recent-checklists',
    },

    // USA baseline (country_code US) — curated national-level
    {
      category_slug: 'websites-regional',
      region_code: 'NA',
      country_code: 'US',
      title: 'National Audubon Society',
      description: 'US bird conservation and advocacy.',
      url: 'https://www.audubon.org/',
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'NA',
      country_code: 'US',
      title: 'National Park Service',
      description: 'US national parks and visitor information.',
      url: 'https://www.nps.gov/',
    },
    // USA travel – hotels/lodges (state-targeted)
    {
      category_slug: 'travel-hotels',
      region_code: 'NA',
      country_code: 'US',
      title: 'Alamo Inn B&B (Rio Grande Valley)',
      description: 'Birding-friendly lodging and tours in the Lower Rio Grande Valley.',
      url: 'https://alamoinnbnb.com/',
      us_states: ['TX'],
    },
    {
      category_slug: 'travel-hotels',
      region_code: 'NA',
      country_code: 'US',
      title: 'Casa Blanca Bed and Breakfast (near Bosque del Apache)',
      description: 'Lodging option near Bosque del Apache NWR (San Antonio, NM).',
      url: 'https://www.innsite.com/inns/B007280.html',
      us_states: ['NM'],
    },

    // USA travel – tour operators / guided trips (state-targeted)
    {
      category_slug: 'travel-tour-operators',
      region_code: 'NA',
      country_code: 'US',
      title: 'Birding Tours Texas',
      description: 'Daily and multiday guided birding tours across Texas.',
      url: 'https://www.birdingtourstexas.com/',
      us_states: ['TX'],
    },
    {
      category_slug: 'travel-tour-operators',
      region_code: 'NA',
      country_code: 'US',
      title: 'Birding Texas and Beyond',
      description: 'Guided birding tours (Rio Grande Valley, coast, hill country, etc.).',
      url: 'https://www.birdingtexasandbeyond.com/',
      us_states: ['TX'],
    },
    {
      category_slug: 'travel-tour-operators',
      region_code: 'NA',
      country_code: 'US',
      title: 'WingsWest Birding',
      description: 'Guided birding tours in New Mexico and the American Southwest.',
      url: 'https://www.wingswestbirding.com/',
      us_states: ['NM'],
    },
    {
      category_slug: 'travel-tour-operators',
      region_code: 'NA',
      country_code: 'US',
      title: 'AZ-Birding',
      description: 'Professional birding guides and tours in Arizona.',
      url: 'https://az-birding.com/',
      us_states: ['AZ'],
    },
    {
      category_slug: 'travel-tour-operators',
      region_code: 'NA',
      country_code: 'US',
      title: 'Cape May Bird Observatory (New Jersey Audubon)',
      description: 'Walks, field trips, and birding programs in Cape May.',
      url: 'https://njaudubon.org/centers/cape-may-bird-observatory/',
      us_states: ['NJ'],
    },
    {
      category_slug: 'travel-tour-operators',
      region_code: 'NA',
      country_code: 'US',
      title: 'Archaeopteryx Birding and Nature Tours (Florida)',
      description: 'Guided birding tours in Florida, including Keys and Dry Tortugas.',
      url: 'https://archaeopteryxbirdingandnaturetours.com/florida-keys-dry-tortugas/',
      us_states: ['FL'],
    },
    {
      category_slug: 'travel-tour-operators',
      region_code: 'NA',
      country_code: 'US',
      title: 'Wilderness Birding Adventures (Alaska)',
      description: 'Alaska birding trips and local guiding.',
      url: 'https://www.wildernessbirding.com/',
      us_states: ['AK'],
    },
    {
      category_slug: 'travel-tour-operators',
      region_code: 'NA',
      country_code: 'US',
      title: 'Hawaii Bird Tours',
      description: 'Guided birding tours across the Hawaiian islands.',
      url: 'https://hawaiibirdtours.com/',
      us_states: ['HI'],
    },
    {
      category_slug: 'travel-nature-parks',
      region_code: 'NA',
      country_code: 'US',
      title: 'Birding Magee Marsh (planning)',
      description: 'Visitor planning and logistics for Magee Marsh birding.',
      url: 'https://mageemarsh.org/logistics.html',
      us_states: ['OH'],
    },
    {
      category_slug: 'news',
      is_global: true,
      title: 'All About Birds (Cornell Lab)',
      description: 'Bird ID guides, articles, and learning resources.',
      url: 'https://www.allaboutbirds.org/',
    },

    // Shopping (global)
    {
      category_slug: 'shopping-binoculars',
      is_global: true,
      title: 'Swarovski Optik',
      description: 'Premium optics for birding and nature viewing.',
      url: 'https://www.swarovskioptik.com/',
    },
    {
      category_slug: 'shopping-binoculars',
      is_global: true,
      title: 'ZEISS Sports Optics',
      description: 'Optics for birding and wildlife observation.',
      url: 'https://www.zeiss.com/consumer-products/int/sports-optics.html',
    },
    {
      category_slug: 'shopping-cameras',
      is_global: true,
      title: 'Canon',
      description: 'Cameras and lenses used for wildlife photography.',
      url: 'https://www.usa.canon.com/',
    },
    {
      category_slug: 'shopping-cameras',
      is_global: true,
      title: 'Sony Alpha',
      description: 'Mirrorless cameras and lenses (wildlife capable).',
      url: 'https://www.sony.com/alpha',
    },
  ];

  // USA per-state (real, stable URLs): eBird region portals and optionally hotspots lists.
  const includeStateEbird = envFlag('CURATED_INCLUDE_US_STATE_EBIRD', true);
  const includeStateHotspots = envFlag('CURATED_INCLUDE_EXTRA_US_STATE_HOTSPOTS', true);
  const includeStateRecent = envFlag('CURATED_INCLUDE_US_STATE_RECENT_CHECKLISTS', true);
  const includeStateBirdList = envFlag('CURATED_INCLUDE_US_STATE_BIRD_LIST', true);
  if (includeStateEbird) {
    for (const st of US_STATES) {
      const regionCode = `US-${st.code}`;
      items.push({
        category_slug: 'websites-regional',
        region_code: 'NA',
        country_code: 'US',
        title: `eBird ${st.name}`,
        description: `State portal for birding data, recent sightings, and hotspots in ${st.name}.`,
        url: `https://ebird.org/region/${regionCode}`,
        us_states: [st.code],
      });

      // Regional birding websites: everyone gets eBird deep links + Audubon IBA list (~5 items in this category per state).
      items.push({
        category_slug: 'websites-regional',
        region_code: 'NA',
        country_code: 'US',
        title: `eBird Illustrated Checklist: ${st.name}`,
        description: `Illustrated checklist for birds recorded in ${st.name}.`,
        url: `https://ebird.org/region/${regionCode}/illustrated-checklist`,
        us_states: [st.code],
      });
      items.push({
        category_slug: 'websites-regional',
        region_code: 'NA',
        country_code: 'US',
        title: `eBird Subregions: ${st.name}`,
        description: `Counties and finer regions within ${st.name} in eBird.`,
        url: `https://ebird.org/region/${regionCode}/subregions`,
        us_states: [st.code],
      });
      items.push({
        category_slug: 'websites-regional',
        region_code: 'NA',
        country_code: 'US',
        title: `eBird Species List: ${st.name}`,
        description: `Species tallies and filters for ${st.name}.`,
        url: `https://ebird.org/region/${regionCode}/species`,
        us_states: [st.code],
      });
      items.push({
        category_slug: 'websites-regional',
        region_code: 'NA',
        country_code: 'US',
        title: `Audubon Important Bird Areas: ${st.name}`,
        description: `Important Bird Areas (IBA) list for ${st.name}.`,
        url: `https://netapp.audubon.org/iba/IBAList/${regionCode}/State`,
        us_states: [st.code],
      });

      // Larger birding states: add Macaulay Library search + four curated chapter / state org sites (~10 in this category).
      if (BIG_STATE_CODES.has(st.code)) {
        items.push({
          category_slug: 'websites-regional',
          region_code: 'NA',
          country_code: 'US',
          title: `Macaulay Library (photos & audio): ${st.name}`,
          description: `Regional photos and audio in the Macaulay Library for ${st.name}.`,
          url: `https://search.macaulaylibrary.org/catalog?regionCode=${encodeURIComponent(regionCode)}&searchField=region&view=grid`,
          us_states: [st.code],
        });
        const extras = BIG_STATE_REGIONAL_SITES[st.code];
        if (extras) {
          for (const ex of extras) {
            items.push({
              category_slug: 'websites-regional',
              region_code: 'NA',
              country_code: 'US',
              title: ex.title,
              description: ex.description,
              url: ex.url,
              us_states: [st.code],
            });
          }
        }
      }

      if (includeStateHotspots) {
        items.push({
          category_slug: 'travel-nature-parks',
          region_code: 'NA',
          country_code: 'US',
          title: `eBird Hotspots: ${st.name}`,
          description: `Hotspots listing for birding locations in ${st.name}.`,
          url: `https://ebird.org/region/${regionCode}/hotspots`,
          us_states: [st.code],
        });
      }
      if (includeStateRecent) {
        items.push({
          category_slug: 'news',
          region_code: 'NA',
          country_code: 'US',
          title: `eBird Recent Checklists: ${st.name}`,
          description: `Recent birding checklists in ${st.name}.`,
          url: `https://ebird.org/region/${regionCode}/recent-checklists`,
          us_states: [st.code],
        });
      }
      if (includeStateBirdList) {
        items.push({
          category_slug: 'shopping-books',
          region_code: 'NA',
          country_code: 'US',
          title: `eBird Bird List: ${st.name}`,
          description: `Species list and filters for ${st.name} in eBird.`,
          url: `https://ebird.org/region/${regionCode}/bird-list`,
          us_states: [st.code],
        });
      }

      // Stable travel resource per-state: NPS directory (lists NPS units in the state).
      items.push({
        category_slug: 'travel-nature-parks',
        region_code: 'NA',
        country_code: 'US',
        title: `National Parks in ${st.name} (NPS)`,
        description: `Directory of National Park Service sites in ${st.name}.`,
        url: `https://www.nps.gov/state/${st.code.toLowerCase()}/index.htm`,
        us_states: [st.code],
      });

      // Add additional official NPS per-state views (useful for planning).
      items.push({
        category_slug: 'travel-nature-parks',
        region_code: 'NA',
        country_code: 'US',
        title: `National Parks in ${st.name} (NPS List View)`,
        description: `List view of National Park Service sites in ${st.name}.`,
        url: `https://home.nps.gov/state/${st.code.toLowerCase()}/list.htm`,
        us_states: [st.code],
      });

      items.push({
        category_slug: 'travel-nature-parks',
        region_code: 'NA',
        country_code: 'US',
        title: `Find a Park in ${st.name} (NPS)`,
        description: `NPS park finder filtered to ${st.name}.`,
        url: `https://www.nps.gov/findapark/index.htm?pm=-1&s=${st.code}&v=map`,
        us_states: [st.code],
      });

      items.push({
        category_slug: 'travel-nature-parks',
        region_code: 'NA',
        country_code: 'US',
        title: `NPS Maps in ${st.name}`,
        description: `Downloadable National Park Service maps for ${st.name}.`,
        url: `https://www.nps.gov/carto/carto-states.cfm?state=${st.code.toLowerCase()}`,
        us_states: [st.code],
      });
    }
  }

  return items;
}

async function seedCuratedReal() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const shouldTruncate = process.argv.includes('--truncate');

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
      console.log('🧹 Truncating items/likes/ratings/state links...');
      await client.query('TRUNCATE TABLE item_us_states, ratings, likes, items RESTART IDENTITY CASCADE;');
    }

    const categories = (await client.query('SELECT id, slug, name FROM categories')).rows;
    const countries = (await client.query(`
      SELECT c.id, c.code, c.name, c.region_id, r.code AS region_code
      FROM countries c
      JOIN regions r ON r.id = c.region_id
    `)).rows;
    const regions = (await client.query('SELECT id, code FROM regions')).rows;

    const categoryIdBySlug = new Map(categories.map(c => [c.slug, c.id]));
    const countryByCode = new Map(countries.map(c => [c.code, c]));
    const regionIdByCode = new Map(regions.map(r => [r.code, r.id]));

    const items = curatedItems();

    let inserted = 0;
    let skipped = 0;

    for (const item of items) {
      const category_id = categoryIdBySlug.get(item.category_slug);
      if (!category_id) {
        throw new Error(`Unknown category slug: ${item.category_slug}`);
      }

      const is_global = !!item.is_global;
      let region_id = null;
      let country_id = null;

      if (!is_global) {
        const country = item.country_code ? countryByCode.get(item.country_code) : null;
        if (!country && item.country_code) {
          throw new Error(`Unknown country code: ${item.country_code}`);
        }
        country_id = country ? country.id : null;

        const region_code = item.region_code || (country ? country.region_code : null);
        region_id = region_code ? (regionIdByCode.get(region_code) || null) : null;
      }

      const exists = await client.query('SELECT id FROM items WHERE url = $1 LIMIT 1', [item.url]);
      if (exists.rows.length > 0) {
        skipped++;
        continue;
      }

      const res = await client.query(
        `INSERT INTO items (title, description, url, category_id, region_id, country_id, is_global, image_url)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING id`,
        [
          item.title,
          item.description || null,
          item.url,
          category_id,
          region_id,
          country_id,
          is_global,
          item.image_url || null,
        ]
      );

      inserted++;
      const itemId = res.rows[0].id;

      const stateCodes = Array.isArray(item.us_states)
        ? item.us_states.filter(s => typeof s === 'string' && s.length === 2)
        : [];
      if (stateCodes.length > 0) {
        await client.query(
          `INSERT INTO item_us_states (item_id, state_code)
           SELECT $1, unnest($2::text[])
           ON CONFLICT (item_id, state_code) DO NOTHING`,
          [itemId, stateCodes]
        );
      }
    }

    await client.query('COMMIT');

    const counts = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM items) AS items,
        (SELECT COUNT(*) FROM item_us_states) AS item_us_states
    `);

    console.log('✅ Curated seeding complete.');
    console.log(`✅ Inserted: ${inserted}`);
    console.log(`↩️  Skipped (already existed by url): ${skipped}`);
    console.log(`📦 Total items in DB: ${counts.rows[0].items}`);
    console.log(`🧩 item_us_states rows: ${counts.rows[0].item_us_states}`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Curated seed failed:', e?.message || e);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seedCuratedReal();

