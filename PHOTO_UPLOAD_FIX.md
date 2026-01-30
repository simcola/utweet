# Photo Upload Fix

## Problem
Photos weren't uploading because:
1. AWS Lambda/Amplify has a read-only filesystem (except `/tmp`)
2. The code was trying to write to `public/uploads` which fails on AWS
3. The photos table might not exist in the database

## Solution Applied

### 1. Updated Upload Handler
- Detects AWS environment automatically
- On AWS: Stores images as base64 in the database (temporary solution)
- On local: Saves to `public/uploads` folder
- Better error messages and logging

### 2. Table Existence Check
- API now checks if photos table exists before operations
- Returns helpful error message if table is missing

## Next Steps

### Option 1: Use Base64 Storage (Current - Temporary)
The current fix stores images as base64 in the database. This works but:
- ✅ Simple, no additional setup needed
- ❌ Increases database size
- ❌ Not ideal for large images
- ❌ Slower to load

### Option 2: Use AWS S3 (Recommended for Production)
For production, you should use S3 for file storage:

1. **Create S3 Bucket**:
   - Go to AWS S3 Console
   - Create a bucket (e.g., `utweet-photos`)
   - Enable public read access for approved photos

2. **Install AWS SDK**:
   ```bash
   npm install @aws-sdk/client-s3
   ```

3. **Update Environment Variables**:
   Add to AWS Amplify Environment Variables:
   - `AWS_S3_BUCKET_NAME=utweet-photos`
   - `AWS_REGION=us-east-2` (or your region)

4. **Update Upload Code**:
   Replace base64 storage with S3 upload

### Option 3: Ensure Photos Table Exists

Run this on your RDS database:

```bash
node database/run_photos_migration.js "postgresql://utweet_admin:uTweet11!@utweet-db.ch8c86aka86t.us-east-2.rds.amazonaws.com:5432/utweet"
```

Or manually run the SQL from `database/add_photos_table.sql`

## Testing

1. **Try uploading a photo** from the homepage
2. **Check browser console** for any errors
3. **Check CloudWatch logs** for server-side errors
4. **Check database** to see if photos are being saved:
   ```sql
   SELECT id, username, email, approved, created_at FROM photos;
   ```

## Current Status

- ✅ Upload handler updated to work on AWS
- ✅ Better error messages
- ✅ Table existence check
- ⚠️ Using base64 storage (temporary)
- ⚠️ Need to verify photos table exists in database

