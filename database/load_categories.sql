-- Load default categories into the database
-- This includes the column_span field

-- Insert default categories
INSERT INTO categories (name, slug, parent_id, display_order, column_span) VALUES
    ('Websites (Global)', 'websites-global', NULL, 1, 1),
    ('Websites (Regional)', 'websites-regional', NULL, 2, 1),
    ('Travel', 'travel', NULL, 3, 1),
    ('News', 'news', NULL, 4, 1),
    ('Shopping', 'shopping', NULL, 5, 2)
ON CONFLICT (slug) DO NOTHING;

-- Insert travel subcategories
INSERT INTO categories (name, slug, parent_id, display_order, column_span)
SELECT 'Hotels', 'travel-hotels', id, 1, 1 FROM categories WHERE slug = 'travel'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, parent_id, display_order, column_span)
SELECT 'Nature Parks', 'travel-nature-parks', id, 2, 1 FROM categories WHERE slug = 'travel'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, parent_id, display_order, column_span)
SELECT 'Tour Operators', 'travel-tour-operators', id, 3, 1 FROM categories WHERE slug = 'travel'
ON CONFLICT (slug) DO NOTHING;

-- Insert shopping subcategories
INSERT INTO categories (name, slug, parent_id, display_order, column_span)
SELECT 'Binoculars', 'shopping-binoculars', id, 1, 1 FROM categories WHERE slug = 'shopping'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, parent_id, display_order, column_span)
SELECT 'Cameras', 'shopping-cameras', id, 2, 1 FROM categories WHERE slug = 'shopping'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, parent_id, display_order, column_span)
SELECT 'Clothing', 'shopping-clothing', id, 3, 1 FROM categories WHERE slug = 'shopping'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, parent_id, display_order, column_span)
SELECT 'Books & Guides', 'shopping-books', id, 4, 1 FROM categories WHERE slug = 'shopping'
ON CONFLICT (slug) DO NOTHING;

