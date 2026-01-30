-- Migration: Add column_span to categories table
-- Run this to add the column_span field for controlling category display width

-- Add the column if it doesn't exist
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS column_span INTEGER DEFAULT 1 CHECK (column_span IN (1, 2));

-- Update existing categories to have default column_span of 1
UPDATE categories SET column_span = 1 WHERE column_span IS NULL;

