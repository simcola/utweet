-- Add photos table and related tables to existing database
-- Run this on your RDS database if photos table doesn't exist

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
    id SERIAL PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    species VARCHAR(255),
    airesponse TEXT,
    likes INTEGER DEFAULT 0,
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Photo likes table to track individual user likes
CREATE TABLE IF NOT EXISTS photo_likes (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    user_ip VARCHAR(45) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(photo_id, user_ip)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_approved ON photos(approved);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_likes ON photos(likes);
CREATE INDEX IF NOT EXISTS idx_photo_likes_photo ON photo_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_likes_user ON photo_likes(user_ip);

