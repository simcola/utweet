-- Migration: Add column_span to categories table
-- Run this to add the column_span field for controlling category display width

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS column_span INTEGER DEFAULT 1 CHECK (column_span IN (1, 2));

-- Update existing shopping category to span 2 columns
UPDATE categories SET column_span = 2 WHERE slug = 'shopping';


