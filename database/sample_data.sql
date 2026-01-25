-- Sample data for uTweet.com database
-- Note: Run this AFTER running schema.sql
-- Regions and categories are already inserted in schema.sql

-- Insert sample items using a unified dataset
WITH category_lookup AS (
  SELECT slug, id FROM categories
),
region_lookup AS (
  SELECT code, id FROM regions
),
country_lookup AS (
  SELECT code, id, region_id FROM countries
),
item_data(category_slug, region_code, country_code, title, description, url, is_global, image_url) AS (
  VALUES
    -- Global websites
    ('websites-global', NULL, NULL, 'eBird - Cornell Lab of Ornithology', 'The world''s largest database of bird observations. Submit your sightings, explore distribution maps, and contribute to citizen science.', 'https://ebird.org', true, 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400'),
    ('websites-global', NULL, NULL, 'All About Birds', 'Comprehensive bird guide with photos, sounds, and detailed information about North American birds.', 'https://www.allaboutbirds.org', true, 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=400'),
    ('websites-global', NULL, NULL, 'BirdLife International', 'Global partnership of conservation organizations working to conserve birds, their habitats, and biodiversity.', 'https://www.birdlife.org', true, 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400'),
    ('websites-global', NULL, NULL, 'BirdGuides', 'Daily bird news, sightings, and ID resources for birders around the world.', 'https://www.birdguides.com', true, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400'),

    -- Regional websites (alphabetical by country)
    ('websites-regional', 'NA', 'CA', 'Birds Canada', 'National organization dedicated to bird research and conservation across Canada.', 'https://www.birdscanada.org', false, 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400'),
    ('websites-regional', 'NA', 'MX', 'Aves de México', 'Spanish-language hub for Mexican birdwatching news, hotspots, and conservation projects.', 'https://avesdemexico.gob.mx', false, 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=400'),
    ('websites-regional', 'NA', 'US', 'Audubon Society', 'National Audubon Society protects birds and the places they need, today and tomorrow.', 'https://www.audubon.org', false, 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400'),
    ('websites-regional', 'SA', 'AR', 'Aves Argentinas', 'Argentina''s leading bird conservation NGO with resources for birders nationwide.', 'https://www.avesargentinas.org.ar', false, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400'),
    ('websites-regional', 'SA', 'BR', 'SAVE Brasil', 'Brazilian partner of BirdLife International promoting bird conservation and research.', 'https://savebrasil.org.br', false, 'https://images.unsplash.com/photo-1496387314164-18b0105d8fcb?w=400'),
    ('websites-regional', 'SA', 'CL', 'Red de Observadores de Aves de Chile', 'Citizen science network sharing bird sightings, checklists, and conservation updates in Chile.', 'https://www.redobservadores.cl', false, 'https://images.unsplash.com/photo-1520880867055-1e30d1cb001c?w=400'),
    ('websites-regional', 'EU', 'DE', 'NABU - Nature And Biodiversity Conservation Union', 'Germany''s largest nature conservation group with extensive birdwatching resources.', 'https://www.nabu.de', false, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400'),
    ('websites-regional', 'EU', 'ES', 'SEO BirdLife', 'Sociedad Española de Ornitología provides news, guided trips, and conservation campaigns in Spain.', 'https://seo.org', false, 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=400'),
    ('websites-regional', 'EU', 'FR', 'Ligue pour la Protection des Oiseaux', 'France''s leading bird protection league with reserves, events, and advocacy.', 'https://www.lpo.fr', false, 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=400'),
    ('websites-regional', 'EU', 'UK', 'RSPB - Royal Society for the Protection of Birds', 'The UK''s largest nature conservation charity, inspiring everyone to give nature a home.', 'https://www.rspb.org.uk', false, 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400'),
    ('websites-regional', 'AS', 'CN', 'China Birdwatching Association', 'Nationwide organization uniting Chinese bird clubs, events, and conservation initiatives.', 'https://www.cba.org.cn', false, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400'),
    ('websites-regional', 'AS', 'IN', 'Bird Count India', 'Crowdsourced bird monitoring program coordinating events like the Great Backyard Bird Count.', 'https://www.birdcount.in', false, 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400'),
    ('websites-regional', 'AS', 'JP', 'Wild Bird Society of Japan', 'Promoting bird conservation, research, and ecotourism throughout Japan since 1934.', 'https://www.wbsj.org', false, 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=400'),
    ('websites-regional', 'AF', 'KE', 'Nature Kenya', 'East Africa''s oldest conservation society providing guides, trips, and research in Kenya.', 'https://www.naturekenya.org', false, 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=400'),
    ('websites-regional', 'AF', 'TZ', 'Tanzania Bird Atlas', 'Community-driven atlas mapping the distribution of Tanzania''s birds.', 'https://www.tanzaniabirdatlas.com', false, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400'),
    ('websites-regional', 'AF', 'ZA', 'BirdLife South Africa', 'National bird conservation organization hosting festivals, atlas projects, and courses.', 'https://www.birdlife.org.za', false, 'https://images.unsplash.com/photo-1496387314164-18b0105d8fcb?w=400'),
    ('websites-regional', 'AO', 'AU', 'BirdLife Australia', 'Australia''s pre-eminent bird conservation group offering surveys, trips, and research.', 'https://www.birdlife.org.au', false, 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=400'),
    ('websites-regional', 'AO', 'NZ', 'Birds New Zealand', 'Society for the study of birds in Aotearoa with checklists, field trips, and journals.', 'https://www.birdsnz.org.nz', false, 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=400'),
    ('websites-regional', 'AO', 'PG', 'Papua New Guinea Bird Society', 'Grassroots organization supporting surveys and community ecotourism in PNG.', 'https://www.pngbirdsociety.org.pg', false, 'https://images.unsplash.com/photo-1496387314164-18b0105d8fcb?w=400'),

    -- Travel - Hotels and Lodges
    ('travel-hotels', 'NA', 'US', 'The Lodge at Bosque del Apache', 'Premier birding lodge near the famed Bosque del Apache National Wildlife Refuge in New Mexico.', 'https://www.bosquedelapachelodge.com', false, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'),
    ('travel-hotels', 'NA', 'CA', 'Long Point Eco-Adventures', 'Ontario eco-lodge offering guided bird walks along Lake Erie''s migration corridor.', 'https://longpointecoadventures.com', false, 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400'),
    ('travel-hotels', 'NA', 'MX', 'Celestún Eco Lodge', 'Yucatán coast lodge specializing in flamingo and shorebird excursions.', 'https://www.celestunecolodge.mx', false, 'https://images.unsplash.com/photo-1470123808288-1e59739d9353?w=400'),
    ('travel-hotels', 'SA', 'AR', 'Posada Los Cocuyos', 'Boutique estancia in Iberá Wetlands with expert bird guides and private lagoons.', 'https://www.posadaloscocuyos.com', false, 'https://images.unsplash.com/photo-1551888419-47a2b7d8e37f?w=400'),
    ('travel-hotels', 'SA', 'BR', 'Cristalino Jungle Lodge', 'Award-winning Amazon lodge renowned for canopy towers and macaw photography.', 'https://cristalinolodge.com', false, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'),
    ('travel-hotels', 'SA', 'CL', 'Patagonia Camp Birding Retreat', 'Luxury yurts overlooking Torres del Paine with daily birding expeditions.', 'https://www.patagoniacamp.com', false, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'),
    ('travel-hotels', 'EU', 'DE', 'Spreewald Bio-Hotel', 'Eco-certified hotel in Brandenburg''s biosphere reserve with guided birding by kayak.', 'https://www.spreewald-bio-hotel.de', false, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'),
    ('travel-hotels', 'EU', 'ES', 'Doñana Birding Lodge', 'Andalusian farmhouse lodge offering tours through Doñana National Park.', 'https://www.donanabirdinglodge.es', false, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'),
    ('travel-hotels', 'EU', 'FR', 'Camargue Birdwatchers Inn', 'Family-run inn near the Rhône delta featuring custom wetland bird safaris.', 'https://www.camarguebirdinn.fr', false, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'),
    ('travel-hotels', 'EU', 'UK', 'Fair Isle Bird Observatory Lodge', 'Historic observatory lodge for seabird studies between Orkney and Shetland.', 'https://www.fairislebirdobs.co.uk', false, 'https://images.unsplash.com/photo-1551888419-47a2b7d8e37f?w=400'),
    ('travel-hotels', 'AS', 'CN', 'Poyang Lake Birding Resort', 'Seasonal lakeside resort tailored for cranes and winter waterbirds in Jiangxi.', 'https://www.poyanglakeresort.cn', false, 'https://images.unsplash.com/photo-1470123808288-1e59739d9353?w=400'),
    ('travel-hotels', 'AS', 'IN', 'Thattekad Bird Sanctuary Lodge', 'Kerala jungle lodge with resident guides for the Dr. Salim Ali Bird Sanctuary.', 'https://thattekadbirdlodge.in', false, 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400'),
    ('travel-hotels', 'AS', 'JP', 'Karuizawa Birding Retreat', 'Nagano mountain ryokan offering blinds for Japanese grosbeaks and forest species.', 'https://www.karuizawabirdretreat.jp', false, 'https://images.unsplash.com/photo-1470123808288-1e59739d9353?w=400'),
    ('travel-hotels', 'AF', 'KE', 'Lake Naivasha Bird Camp', 'Tented camp on Lake Naivasha with daily boat safaris for African fish eagles.', 'https://www.lakenaivashabirdcamp.co.ke', false, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'),
    ('travel-hotels', 'AF', 'TZ', 'Ngorongoro Forest Lodge', 'Luxury lodge on the crater rim featuring montane forest bird specialties.', 'https://www.ngorongoroforestlodge.com', false, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'),
    ('travel-hotels', 'AF', 'ZA', 'Kirstenbosch Garden Villa', 'Cape Town guesthouse overlooking Table Mountain''s renowned botanical gardens.', 'https://www.kirstenboschvilla.co.za', false, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'),
    ('travel-hotels', 'AO', 'AU', 'Cairns Daintree Bird Lodge', 'Tropical Queensland lodge focused on cassowary and rainforest birding.', 'https://www.daintreebirdlodge.com.au', false, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'),
    ('travel-hotels', 'AO', 'NZ', 'Stewart Island Kiwi Retreat', 'Boutique lodge with guided night walks for Stewart Island brown kiwi.', 'https://www.stewartislandkiwiretreat.nz', false, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'),
    ('travel-hotels', 'AO', 'PG', 'Varirata Birding Lodge', 'Papua New Guinea highlands lodge for birds-of-paradise excursions.', 'https://www.variratabirdinglodge.pg', false, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'),

    -- Travel - Nature Parks & Reserves
    ('travel-nature-parks', 'NA', 'US', 'Everglades National Park', 'Home to over 350 species of birds, including iconic wading birds and raptors.', 'https://www.nps.gov/ever', false, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400'),
    ('travel-nature-parks', 'NA', 'CA', 'Point Pelee National Park', 'Ontario peninsula famous for spring warbler fallouts and Monarch butterfly migration.', 'https://parks.canada.ca/pn-np/on/pelee', false, 'https://images.unsplash.com/photo-1455218873509-8097305ee378?w=400'),
    ('travel-nature-parks', 'NA', 'MX', 'Sian Ka''an Biosphere Reserve', 'UNESCO site protecting mangroves and tropical forest birds on the Yucatán Peninsula.', 'https://www.sian-kaan.org', false, 'https://images.unsplash.com/photo-1496387314164-18b0105d8fcb?w=400'),
    ('travel-nature-parks', 'SA', 'AR', 'Iberá Wetlands Provincial Park', 'Extensive marshlands supporting jabiru storks, marsh deer, and capybaras.', 'https://www.parquedelibera.com', false, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400'),
    ('travel-nature-parks', 'SA', 'BR', 'Pantanal Matogrossense National Park', 'Floodplain refuge for hyacinth macaws, herons, and jaguars.', 'https://www.icmbio.gov.br/pantanal', false, 'https://images.unsplash.com/photo-1470115636492-6d2b56f9146d?w=400'),
    ('travel-nature-parks', 'SA', 'CL', 'Lauca National Park', 'Altiplano park in northern Chile known for flamingos and high Andean specialties.', 'https://www.conaf.cl/parques/parque-nacional-lauca', false, 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=400'),
    ('travel-nature-parks', 'EU', 'DE', 'Wadden Sea National Park', 'World Heritage tidal flats attracting massive shorebird migrations.', 'https://www.nationalpark-wattenmeer.de', false, 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=400'),
    ('travel-nature-parks', 'EU', 'ES', 'Doñana National Park', 'Wetland paradise for spoonbills, imperial eagles, and migrating waterfowl.', 'https://www.donanabirding.com', false, 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=400'),
    ('travel-nature-parks', 'EU', 'FR', 'Camargue Regional Park', 'Rhone delta marshes famous for flamingos, herons, and wild horses.', 'https://www.parc-camargue.fr', false, 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=400'),
    ('travel-nature-parks', 'EU', 'UK', 'Cairngorms National Park', 'Scotland''s largest national park with capercaillie, ptarmigan, and crested tit.', 'https://www.cairngorms.co.uk', false, 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=400'),
    ('travel-nature-parks', 'AS', 'CN', 'Poyang Lake Wetlands', 'China''s largest freshwater lake, winter refuge for Siberian cranes.', 'https://www.poyanglake.org', false, 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=400'),
    ('travel-nature-parks', 'AS', 'IN', 'Kaziranga National Park', 'Assam reserve protecting Indian rhinoceros and more than 500 bird species.', 'https://www.kaziranganationalpark-india.com', false, 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=400'),
    ('travel-nature-parks', 'AS', 'JP', 'Kushiro Shitsugen National Park', 'Largest marsh in Japan, breeding ground for red-crowned cranes.', 'https://www.env.go.jp/en/nature/nps/park/kushiro', false, 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=400'),
    ('travel-nature-parks', 'AF', 'KE', 'Masai Mara National Reserve', 'Savannah reserve famed for raptors, secretarybirds, and migration spectacles.', 'https://www.masaimara.com', false, 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=400'),
    ('travel-nature-parks', 'AF', 'TZ', 'Ngorongoro Conservation Area', 'Crater ecosystem harboring flamingos, ostriches, and montane forest birds.', 'https://www.ngorongorocrater.org', false, 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=400'),
    ('travel-nature-parks', 'AF', 'ZA', 'Kruger National Park', 'One of Africa''s largest game reserves, home to 500+ bird species.', 'https://www.sanparks.org/parks/kruger', false, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'),
    ('travel-nature-parks', 'AO', 'AU', 'Kakadu National Park', 'Northern Territory wetlands abounding with jabirus and magpie geese.', 'https://parksaustralia.gov.au/kakadu', false, 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=400'),
    ('travel-nature-parks', 'AO', 'NZ', 'Fiordland National Park', 'South Island wilderness hosting kea, kiwi, and rare seabirds.', 'https://www.doc.govt.nz/fiordland', false, 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=400'),
    ('travel-nature-parks', 'AO', 'PG', 'Varirata National Park', 'Highland rainforest near Port Moresby renowned for birds-of-paradise.', 'https://www.variratanationalpark.pg', false, 'https://images.unsplash.com/photo-1523978591478-c753949ff840?w=400'),

    -- Travel - Tour Operators (mix of global and country-specific)
    ('travel-tour-operators', NULL, NULL, 'Victor Emanuel Nature Tours', 'Premier birding tour company offering guided trips to hotspots worldwide.', 'https://www.ventbird.com', true, 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400'),
    ('travel-tour-operators', 'NA', 'US', 'Field Guides Birding Tours', 'Expert-led birding tours throughout the Americas spotlighting migration spectacles.', 'https://www.fieldguides.com', false, 'https://images.unsplash.com/photo-1444927714506-8492d94b3f90?w=400'),
    ('travel-tour-operators', 'EU', 'UK', 'Sunbird Tours', 'UK-based company offering small-group birding adventures across the globe.', 'https://www.sunbirdeurope.com', false, 'https://images.unsplash.com/photo-1444927714506-8492d94b3f90?w=400'),
    ('travel-tour-operators', 'SA', 'BR', 'Birding Pantanal', 'Brazilian operator specializing in Pantanal wetlands and Atlantic Forest excursions.', 'https://www.birdingpantanal.com', false, 'https://images.unsplash.com/photo-1444927714506-8492d94b3f90?w=400'),
    ('travel-tour-operators', 'AS', 'IN', 'Asian Adventures Birding', 'Indian ecotour company running tours to the Himalayas, Western Ghats, and Northeast.', 'https://www.asianadventures.com', false, 'https://images.unsplash.com/photo-1444927714506-8492d94b3f90?w=400'),
    ('travel-tour-operators', 'AF', 'ZA', 'Rockjumper Birding Tours', 'South African guides delivering birding itineraries across Africa and beyond.', 'https://www.rockjumperbirding.com', false, 'https://images.unsplash.com/photo-1444927714506-8492d94b3f90?w=400'),
    ('travel-tour-operators', 'AO', 'AU', 'Bellbird Tours', 'Australian birding company covering all states and remote islands.', 'https://www.bellbirdtours.com', false, 'https://images.unsplash.com/photo-1444927714506-8492d94b3f90?w=400'),

    -- News (global)
    ('news', NULL, NULL, 'BirdWatching Magazine', 'Monthly magazine covering birding news, identification tips, and conservation stories.', 'https://www.birdwatchingdaily.com', true, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400'),
    ('news', NULL, NULL, 'Audubon Magazine', 'Award-winning magazine covering bird conservation, science, and the environment.', 'https://www.audubon.org/magazine', true, 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=400'),
    ('news', NULL, NULL, 'Rare Bird Alert Weekly', 'Weekly summary of rare bird sightings and twitcher alerts across the globe.', 'https://rarebirdalert.co.uk', true, 'https://images.unsplash.com/photo-1517832207067-4db24a2ae47c?w=400'),

    -- Shopping - Binoculars (global)
    ('shopping-binoculars', NULL, NULL, 'Swarovski Optik', 'Premium binoculars and spotting scopes for serious birders. Known for exceptional clarity and light transmission.', 'https://www.swarovskioptik.com', true, 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400'),
    ('shopping-binoculars', NULL, NULL, 'Zeiss Sport Optics', 'High-quality binoculars and spotting scopes with excellent optics and rugged construction.', 'https://www.zeiss.com', true, 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400'),
    ('shopping-binoculars', NULL, NULL, 'Nikon Monarch Series', 'Reliable and affordable binoculars for bird watching, from entry-level to professional models.', 'https://www.nikon.com', true, 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=400'),

    -- Shopping - Cameras (global)
    ('shopping-cameras', NULL, NULL, 'Canon Bird Photography', 'Professional cameras and lenses perfect for capturing bird behavior and identification.', 'https://www.canon.com', true, 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400'),
    ('shopping-cameras', NULL, NULL, 'Sony Alpha for Birding', 'Mirrorless cameras with fast autofocus and excellent telephoto lenses for wildlife photography.', 'https://www.sony.com', true, 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400'),
    ('shopping-cameras', NULL, NULL, 'Fujifilm X-Series Wildlife Kit', 'Compact mirrorless setup ideal for travel bird photography and digiscoping.', 'https://www.fujifilm.com', true, 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400'),

    -- Shopping - Clothing (global)
    ('shopping-clothing', NULL, NULL, 'Columbia Sportswear', 'Outdoor clothing and gear designed for bird watching in all weather conditions.', 'https://www.columbia.com', true, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'),
    ('shopping-clothing', NULL, NULL, 'Patagonia Birding Gear', 'Sustainable outdoor clothing perfect for long days in the field bird watching.', 'https://www.patagonia.com', true, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'),
    ('shopping-clothing', NULL, NULL, 'KÜHL Explorers Collection', 'Technical apparel engineered for comfort on rugged birding expeditions.', 'https://www.kuhl.com', true, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'),

    -- Shopping - Books & Guides (country-specific)
    ('shopping-books', 'NA', 'US', 'Sibley Guide to Birds', 'Comprehensive field guide to North American birds with detailed illustrations and range maps.', 'https://www.sibleyguides.com', false, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),
    ('shopping-books', 'NA', 'CA', 'Birds of Canada Field Guide', 'Illustrated guide to Canadian birdlife featuring maps, status, and identification tips.', 'https://www.birdscanada.org/store', false, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),
    ('shopping-books', 'NA', 'MX', 'Guía de Aves de México', 'Spanish-language field guide highlighting endemic and migratory birds across Mexico.', 'https://www.avesdemexico.gob.mx/guia', false, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),
    ('shopping-books', 'SA', 'BR', 'Aves do Brasil Guia', 'Comprehensive Portuguese-language field guide covering Brazil''s diverse avifauna.', 'https://www.savebrasil.org.br/loja', false, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),
    ('shopping-books', 'EU', 'UK', 'Collins Bird Guide', 'The definitive field guide to the birds of Britain and Europe, with detailed illustrations.', 'https://www.harpercollins.co.uk', false, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),
    ('shopping-books', 'EU', 'DE', 'Kosmos Vogelführer', 'German-language guide covering over 800 European bird species with audio references.', 'https://www.kosmos.de', false, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),
    ('shopping-books', 'EU', 'FR', 'Oiseaux d''Europe Guide', 'French field guide featuring distribution maps, habitat notes, and plumage details.', 'https://www.plumesetcie.fr', false, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),
    ('shopping-books', 'AS', 'IN', 'Birds of the Indian Subcontinent', 'Field guide covering India, Pakistan, Sri Lanka, and Bangladesh with detailed plates.', 'https://www.asianadventures.com/shop', false, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),
    ('shopping-books', 'AS', 'JP', 'Birds of Japan Handbook', 'Comprehensive guide to Japanese avifauna including seasonal distribution charts.', 'https://www.wbsj.org/shop', false, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),
    ('shopping-books', 'AF', 'ZA', 'Sasol Birds of Southern Africa', 'Best-selling guide for southern African birders with updated taxonomy and maps.', 'https://www.penguinrandomhouse.co.za', false, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),
    ('shopping-books', 'AO', 'AU', 'Pizzey and Knight Bird Guide to Australia', 'Authoritative Australian field guide featuring habitat icons and subspecies notes.', 'https://www.pizzey-knight.com.au', false, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),
    ('shopping-books', 'AO', 'NZ', 'Field Guide to the Birds of New Zealand', 'Essential guide for identifying New Zealand''s endemic and migratory birds.', 'https://www.penguin.co.nz/books/field-guide-to-the-birds-of-new-zealand-9780143570929', false, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),
    ('shopping-books', 'AO', 'PG', 'Birds of New Guinea Field Guide', 'Extensive coverage of Papua New Guinea''s birds-of-paradise and island endemics.', 'https://www.pngbirdsociety.org.pg/store', false, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400')
)
INSERT INTO items (title, description, url, category_id, region_id, country_id, is_global, image_url)
SELECT
  d.title,
  d.description,
  d.url,
  cat.id,
  COALESCE(reg.id, country.region_id),
  country.id,
  d.is_global,
  d.image_url
FROM item_data d
JOIN category_lookup cat ON cat.slug = d.category_slug
LEFT JOIN region_lookup reg ON d.region_code = reg.code
LEFT JOIN country_lookup country ON d.country_code = country.code;

-- Insert sample ratings (ratings for some items)
-- Note: These use random IPs for demonstration. Replace with actual item IDs after running the above inserts.
INSERT INTO ratings (item_id, user_ip, rating)
SELECT id, '192.168.1.100', 5 FROM items WHERE title = 'eBird - Cornell Lab of Ornithology'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO ratings (item_id, user_ip, rating)
SELECT id, '192.168.1.101', 4 FROM items WHERE title = 'eBird - Cornell Lab of Ornithology'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO ratings (item_id, user_ip, rating)
SELECT id, '192.168.1.102', 5 FROM items WHERE title = 'All About Birds'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO ratings (item_id, user_ip, rating)
SELECT id, '192.168.1.103', 4 FROM items WHERE title = 'Swarovski Optik'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO ratings (item_id, user_ip, rating)
SELECT id, '192.168.1.104', 5 FROM items WHERE title = 'Swarovski Optik'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO ratings (item_id, user_ip, rating)
SELECT id, '192.168.1.105', 5 FROM items WHERE title = 'Everglades National Park'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO ratings (item_id, user_ip, rating)
SELECT id, '192.168.1.106', 4 FROM items WHERE title = 'Victor Emanuel Nature Tours'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO ratings (item_id, user_ip, rating)
SELECT id, '192.168.1.107', 5 FROM items WHERE title = 'Victor Emanuel Nature Tours'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO ratings (item_id, user_ip, rating)
SELECT id, '192.168.1.108', 4 FROM items WHERE title = 'Sibley Guide to Birds'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO ratings (item_id, user_ip, rating)
SELECT id, '192.168.1.109', 5 FROM items WHERE title = 'Sibley Guide to Birds'
ON CONFLICT (item_id, user_ip) DO NOTHING;

-- Insert sample likes
INSERT INTO likes (item_id, user_ip)
SELECT id, '192.168.1.100' FROM items WHERE title = 'eBird - Cornell Lab of Ornithology'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO likes (item_id, user_ip)
SELECT id, '192.168.1.101' FROM items WHERE title = 'eBird - Cornell Lab of Ornithology'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO likes (item_id, user_ip)
SELECT id, '192.168.1.102' FROM items WHERE title = 'eBird - Cornell Lab of Ornithology'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO likes (item_id, user_ip)
SELECT id, '192.168.1.103' FROM items WHERE title = 'All About Birds'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO likes (item_id, user_ip)
SELECT id, '192.168.1.104' FROM items WHERE title = 'Swarovski Optik'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO likes (item_id, user_ip)
SELECT id, '192.168.1.105' FROM items WHERE title = 'Everglades National Park'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO likes (item_id, user_ip)
SELECT id, '192.168.1.106' FROM items WHERE title = 'Victor Emanuel Nature Tours'
ON CONFLICT (item_id, user_ip) DO NOTHING;

INSERT INTO likes (item_id, user_ip)
SELECT id, '192.168.1.107' FROM items WHERE title = 'Sibley Guide to Birds'
ON CONFLICT (item_id, user_ip) DO NOTHING;

-- Note: Admin user password hash needs to be generated separately
-- Use the generate_admin_password.js script to create a password hash
-- Example: node generate_admin_password.js
-- Then insert with: INSERT INTO admin_users (username, password_hash) VALUES ('admin', '<generated_hash>');

