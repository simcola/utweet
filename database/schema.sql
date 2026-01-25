-- Create database schema for uTweet.com

-- Regions table
CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (region_id, name),
    UNIQUE (code)
);

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(500),
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    region_id INTEGER REFERENCES regions(id) ON DELETE SET NULL,
    country_id INTEGER REFERENCES countries(id) ON DELETE SET NULL,
    is_global BOOLEAN DEFAULT false,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ratings table
CREATE TABLE IF NOT EXISTS ratings (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    user_ip VARCHAR(45),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, user_ip)
);

-- Likes table
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    user_ip VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, user_ip)
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default regions
INSERT INTO regions (name, code) VALUES
    ('All Regions', 'ALL'),
    ('North America', 'NA'),
    ('South America', 'SA'),
    ('Europe', 'EU'),
    ('Asia', 'AS'),
    ('Africa', 'AF'),
    ('Australia & Oceania', 'AO'),
    ('Antarctica', 'AN')
ON CONFLICT (code) DO NOTHING;

-- Insert default countries (alphabetical within each region)
WITH region_map AS (
  SELECT id, code FROM regions
)
INSERT INTO countries (region_id, name, code)
SELECT rm.id, country_name, country_code
FROM region_map rm
JOIN (
  VALUES
    ('NA', 'Canada', 'CA'),
    ('NA', 'Mexico', 'MX'),
    ('NA', 'United States', 'US'),
    ('SA', 'Argentina', 'AR'),
    ('SA', 'Brazil', 'BR'),
    ('SA', 'Chile', 'CL'),
    ('EU', 'France', 'FR'),
    ('EU', 'Germany', 'DE'),
    ('EU', 'Spain', 'ES'),
    ('EU', 'United Kingdom', 'UK'),
    ('AS', 'China', 'CN'),
    ('AS', 'India', 'IN'),
    ('AS', 'Japan', 'JP'),
    ('AF', 'Kenya', 'KE'),
    ('AF', 'South Africa', 'ZA'),
    ('AF', 'Tanzania', 'TZ'),
    ('AO', 'Australia', 'AU'),
    ('AO', 'New Zealand', 'NZ'),
    ('AO', 'Papua New Guinea', 'PG')
) AS countries(region_code, country_name, country_code)
  ON countries.region_code = rm.code
ON CONFLICT (code) DO NOTHING;

-- Insert default categories
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
    ('Websites (Global)', 'websites-global', NULL, 1),
    ('Websites (Regional)', 'websites-regional', NULL, 2),
    ('Travel', 'travel', NULL, 3),
    ('News', 'news', NULL, 4),
    ('Shopping', 'shopping', NULL, 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert travel subcategories
INSERT INTO categories (name, slug, parent_id, display_order)
SELECT 'Hotels', 'travel-hotels', id, 1 FROM categories WHERE slug = 'travel'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, parent_id, display_order)
SELECT 'Nature Parks', 'travel-nature-parks', id, 2 FROM categories WHERE slug = 'travel'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, parent_id, display_order)
SELECT 'Tour Operators', 'travel-tour-operators', id, 3 FROM categories WHERE slug = 'travel'
ON CONFLICT (slug) DO NOTHING;

-- Insert shopping subcategories
INSERT INTO categories (name, slug, parent_id, display_order)
SELECT 'Binoculars', 'shopping-binoculars', id, 1 FROM categories WHERE slug = 'shopping'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, parent_id, display_order)
SELECT 'Cameras', 'shopping-cameras', id, 2 FROM categories WHERE slug = 'shopping'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, parent_id, display_order)
SELECT 'Clothing', 'shopping-clothing', id, 3 FROM categories WHERE slug = 'shopping'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, parent_id, display_order)
SELECT 'Books & Guides', 'shopping-books', id, 4 FROM categories WHERE slug = 'shopping'
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_region ON items(region_id);
CREATE INDEX IF NOT EXISTS idx_items_country ON items(country_id);
CREATE INDEX IF NOT EXISTS idx_ratings_item ON ratings(item_id);
CREATE INDEX IF NOT EXISTS idx_likes_item ON likes(item_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region_id);

