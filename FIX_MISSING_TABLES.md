# Fix Missing Photos Table

## The Error
```
relation "photos" does not exist
```

The photos table hasn't been created in your RDS database yet.

## Solution: Add Photos Table to RDS

### Option 1: Using psql (Recommended)

Run this command from your local machine:

```bash
psql "postgresql://utweet_admin:uTweet11!@utweet-db.ch8c86aka86t.us-east-2.rds.amazonaws.com:5432/utweet" -f database/add_photos_table.sql
```

Or manually run the SQL:

```bash
psql "postgresql://utweet_admin:uTweet11!@utweet-db.ch8c86aka86t.us-east-2.rds.amazonaws.com:5432/utweet"
```

Then paste and run:
```sql
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

CREATE TABLE IF NOT EXISTS photo_likes (
    id SERIAL PRIMARY KEY,
    photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    user_ip VARCHAR(45) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(photo_id, user_ip)
);

CREATE INDEX IF NOT EXISTS idx_photos_approved ON photos(approved);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
CREATE INDEX IF NOT EXISTS idx_photos_likes ON photos(likes);
CREATE INDEX IF NOT EXISTS idx_photo_likes_photo ON photo_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_likes_user ON photo_likes(user_ip);
```

### Option 2: Using AWS RDS Query Editor

1. Go to AWS RDS Console
2. Select your database
3. Click "Query Editor" (if available)
4. Paste and run the SQL above

## Verify It Worked

After running the migration, test:

```bash
node test_rds_connection.js "postgresql://utweet_admin:uTweet11!@utweet-db.ch8c86aka86t.us-east-2.rds.amazonaws.com:5432/utweet"
```

Should show the photos table exists.

Or check in psql:
```sql
SELECT table_name FROM information_schema.tables WHERE table_name = 'photos';
```

## About the RSS Errors

The RSS feed errors (404/403) are expected - some feeds don't exist or block requests. The news API handles these gracefully and will still return articles from feeds that work. These errors won't break your app.

## Next Steps

1. ✅ Run the photos table migration on RDS
2. ✅ Deploy the updated code (photos API now handles missing table gracefully)
3. ✅ Categories should now show (we fixed the filtering logic)
4. ✅ News will work (RSS errors are handled)

After adding the photos table, your app should work completely!

