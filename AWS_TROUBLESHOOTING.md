# AWS Amplify - No Data Showing Troubleshooting Guide

If your application deployed successfully but you can't see any data, follow these steps:

## Step 1: Check Environment Variables in AWS Amplify

1. **Go to AWS Amplify Console**
   - Navigate to your app
   - Click on "Environment variables" in the left sidebar

2. **Verify these variables are set:**
   ```
   DATABASE_URL=postgresql://username:password@hostname:5432/utweet
   NEXTAUTH_SECRET=your-random-secret-key-min-32-chars
   NEXTAUTH_URL=https://your-amplify-app-url.amplifyapp.com
   NODE_ENV=production
   ```

3. **Important Notes:**
   - `DATABASE_URL` must be the **full connection string** from RDS
   - `NEXTAUTH_URL` must match your **actual Amplify app URL** (not localhost)
   - After adding/changing variables, **redeploy** your app

## Step 2: Verify Database Connection

### Check RDS Security Group

1. **Go to RDS Console**
   - Select your database instance
   - Click on "Connectivity & security" tab
   - Click on the Security Group link

2. **Edit Inbound Rules**
   - Click "Edit inbound rules"
   - Ensure you have a rule:
     - **Type**: PostgreSQL
     - **Port**: 5432
     - **Source**: `0.0.0.0/0` (allows all IPs) OR specific CIDR blocks
   - **Save rules**

### Test Database Connection

From your local machine, test if you can connect:

```bash
psql -h your-rds-endpoint.rds.amazonaws.com -U your_username -d utweet
```

If this fails, your security group is blocking connections.

## Step 3: Verify Database Schema and Data

### Check if Schema is Loaded

Connect to your RDS database and run:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should show: regions, countries, categories, items, ratings, likes, etc.
```

### Check if Data Exists

```sql
-- Count records in each table
SELECT 'regions' as table_name, COUNT(*) as count FROM regions
UNION ALL
SELECT 'countries', COUNT(*) FROM countries
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'items', COUNT(*) FROM items;
```

### If Tables Don't Exist or Are Empty:

1. **Load Schema:**
   ```bash
   psql -h your-rds-endpoint.rds.amazonaws.com -U your_username -d utweet -f database/schema.sql
   ```

2. **Load Sample Data:**
   ```bash
   psql -h your-rds-endpoint.rds.amazonaws.com -U your_username -d utweet -f database/sample_data.sql
   ```

## Step 4: Check Amplify Build Logs

1. **Go to Amplify Console**
   - Click on your app
   - Go to "Build history"
   - Click on the latest build
   - Check for any errors related to:
     - Database connection
     - Environment variables
     - Build failures

2. **Look for errors like:**
   - `DATABASE_URL environment variable is not set`
   - `Connection refused`
   - `Authentication failed`

## Step 5: Check Browser Console

1. **Open your deployed app**
2. **Open browser DevTools** (F12)
3. **Check Console tab** for errors
4. **Check Network tab** for failed API calls:
   - `/api/regions` - should return 200
   - `/api/categories` - should return 200
   - `/api/items` - should return 200

## Step 6: Test API Endpoints Directly

Try accessing these URLs directly in your browser:

```
https://your-app.amplifyapp.com/api/regions
https://your-app.amplifyapp.com/api/categories
https://your-app.amplifyapp.com/api/items
```

**Expected Results:**
- Should return JSON data (not errors)
- Should show arrays of objects

**If you see errors:**
- Check Amplify function logs
- Verify DATABASE_URL is correct
- Check RDS security group allows connections

## Step 7: Common Issues and Fixes

### Issue: "DATABASE_URL environment variable is not set"

**Fix:**
1. Go to Amplify → Environment variables
2. Add `DATABASE_URL` with your RDS connection string
3. Format: `postgresql://username:password@hostname:5432/database`
4. Redeploy the app

### Issue: "Connection refused" or "ECONNREFUSED"

**Fix:**
1. Check RDS security group allows inbound connections on port 5432
2. Verify RDS instance is publicly accessible (if needed)
3. Check DATABASE_URL hostname is correct

### Issue: "Authentication failed" or "password authentication failed"

**Fix:**
1. Verify username and password in DATABASE_URL are correct
2. Check for special characters in password (may need URL encoding)
3. Test connection locally with same credentials

### Issue: "Database does not exist"

**Fix:**
1. Verify database name in DATABASE_URL matches RDS database name
2. Default database name should be `utweet` (or whatever you created)

### Issue: API returns empty arrays `[]`

**Fix:**
1. Database is connected but has no data
2. Load schema: `psql -h ... -f database/schema.sql`
3. Load sample data: `psql -h ... -f database/sample_data.sql`

### Issue: API returns 500 errors

**Fix:**
1. Check Amplify function logs for detailed error messages
2. Verify database connection string format
3. Check if SSL is required (RDS requires SSL in production)

## Step 8: Verify DATABASE_URL Format

Your DATABASE_URL should look like:

```
postgresql://username:password@hostname:5432/database
```

**Example:**
```
postgresql://utweet_admin:MyPassword123!@utweet-db.xxxxx.us-east-1.rds.amazonaws.com:5432/utweet
```

**Important:**
- If password contains special characters, URL encode them:
  - `@` becomes `%40`
  - `#` becomes `%23`
  - `$` becomes `%24`
  - `%` becomes `%25`
  - `&` becomes `%26`
  - `+` becomes `%2B`
  - `=` becomes `%3D`
  - `?` becomes `%3F`

## Step 9: Enable SSL for RDS (Production)

RDS requires SSL connections in production. Your `lib/db.ts` already handles this:

```typescript
ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
```

This should work, but if you still have SSL issues, you may need to download the RDS certificate.

## Step 10: Quick Checklist

- [ ] DATABASE_URL is set in Amplify environment variables
- [ ] NEXTAUTH_URL matches your Amplify app URL
- [ ] NEXTAUTH_SECRET is set (32+ characters)
- [ ] NODE_ENV is set to "production"
- [ ] RDS security group allows inbound PostgreSQL (port 5432)
- [ ] RDS instance is publicly accessible (if needed)
- [ ] Database schema is loaded (tables exist)
- [ ] Database has data (tables are not empty)
- [ ] App has been redeployed after setting environment variables

## Still Having Issues?

1. **Check Amplify Function Logs:**
   - Go to AWS CloudWatch
   - Find your Amplify app's log group
   - Look for errors related to database connections

2. **Test Database Connection Locally:**
   ```bash
   # Set DATABASE_URL temporarily
   export DATABASE_URL="postgresql://..."
   node test_db_connection.js
   ```

3. **Verify RDS Endpoint:**
   - Make sure you're using the correct endpoint
   - Check RDS console → Connectivity & security → Endpoint

4. **Check Network Connectivity:**
   - Amplify functions run in AWS Lambda
   - They should be able to connect to RDS in the same region
   - If RDS is in a VPC, ensure Lambda has VPC access

## Quick Fix Script

If you want to quickly verify everything, run this from your local machine:

```bash
# Set your RDS connection details
export RDS_HOST="your-rds-endpoint.rds.amazonaws.com"
export RDS_USER="your_username"
export RDS_PASS="your_password"
export RDS_DB="utweet"

# Test connection
psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -c "SELECT version();"

# Check tables
psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -c "\dt"

# Check data
psql -h $RDS_HOST -U $RDS_USER -d $RDS_DB -c "SELECT COUNT(*) FROM items;"
```

If all these work, your database is fine and the issue is likely in Amplify configuration.

