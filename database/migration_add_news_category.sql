-- Add News as a category so it can be ordered
INSERT INTO categories (name, slug, parent_id, display_order, column_span)
VALUES ('News', 'news', NULL, 0, 1)
ON CONFLICT (slug) DO UPDATE 
SET display_order = 0, column_span = 1;







