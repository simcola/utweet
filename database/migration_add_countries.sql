-- Migration: Add countries table and country_id to items table
-- Run this if you already have an existing database with the old schema

-- Create countries table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (region_id, name),
    UNIQUE (code)
);

-- Add country_id column to items table
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS country_id INTEGER REFERENCES countries(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_country ON items(country_id);
CREATE INDEX IF NOT EXISTS idx_countries_region ON countries(region_id);

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


