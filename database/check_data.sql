-- Quick script to check if data exists in the database
-- Run this to verify your data was loaded correctly

-- Check regions
SELECT 'Regions:' as info;
SELECT COUNT(*) as count FROM regions;
SELECT id, name, code FROM regions ORDER BY id;

-- Check countries
SELECT 'Countries:' as info;
SELECT COUNT(*) as count FROM countries;
SELECT c.id, c.name, c.code, r.code AS region_code FROM countries c JOIN regions r ON c.region_id = r.id ORDER BY r.code, c.name;

-- Check categories
SELECT 'Categories:' as info;
SELECT COUNT(*) as count FROM categories;
SELECT id, name, slug, parent_id, display_order FROM categories ORDER BY display_order;

-- Check items
SELECT 'Items:' as info;
SELECT COUNT(*) as count FROM items;
SELECT id, title, category_id, region_id, country_id, is_global FROM items ORDER BY id LIMIT 20;

-- Check ratings
SELECT 'Ratings:' as info;
SELECT COUNT(*) as count FROM ratings;

-- Check likes
SELECT 'Likes:' as info;
SELECT COUNT(*) as count FROM likes;

