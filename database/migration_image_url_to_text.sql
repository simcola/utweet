-- Migration: Change image_url column from VARCHAR(500) to TEXT
-- This is needed to support base64 encoded images which can be very long

ALTER TABLE photos 
ALTER COLUMN image_url TYPE TEXT;

