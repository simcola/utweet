# Quick Fix for 500 Error on AWS Amplify

## Step 1: Verify Changes Are Deployed

First, check if your updated error handling is live:

1. Visit: `https://main.djbnvyhjyy403.amplifyapp.com/api/regions`
2. You should see a JSON response with `code` and `hint` fields (not just "Internal Server Error")

If you still see just "Internal Server Error", the changes aren't deployed yet. Deploy them:

```bash
git add .
git commit -m "Fix error handling"
git push origin main
```

Wait 5-10 minutes for deployment, then check again.

## Step 2: Check the Actual Error

Once deployed, the error response will show details. Look for:

```json
{
  "error": "Failed to fetch regions",
  "message": "...",
  "code": "ECONNREFUSED" or "28P01" or "3D000",
  "hint": "..."
}
```

## Step 3: Most Common Issue - DATABASE_URL Not Set

**90% of the time, this is the problem:**

1. Go to AWS Amplify Console
2. Click your app
3. Click "Environment variables" in left sidebar
4. Check if `DATABASE_URL` exists

**If it doesn't exist:**
- Click "Manage variables"
- Click "Add variable"
- Key: `DATABASE_URL`
- Value: `postgresql://username:password@hostname:5432/database`
- Click "Save"
- **IMPORTANT**: Redeploy the app after adding variables

## Step 4: Verify DATABASE_URL Format

Your DATABASE_URL should be:
```
postgresql://username:password@hostname:5432/database
```

**Example:**
```
postgresql://utweet_admin:MyPassword123!@utweet-db.xxxxx.us-east-1.rds.amazonaws.com:5432/utweet
```

**If password has special characters, URL encode them:**
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`
- `?` → `%3F`

## Step 5: Check RDS Security Group

1. Go to AWS RDS Console
2. Click your database instance
3. Click "Connectivity & security" tab
4. Click the Security Group link
5. Click "Edit inbound rules"
6. Ensure you have:
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: `0.0.0.0/0` (or specific IPs)
7. Click "Save rules"

## Step 6: Test Database Connection

From your local machine, test if you can connect:

```bash
psql -h your-rds-endpoint.rds.amazonaws.com -U your_username -d utweet
```

If this fails, your security group is blocking connections.

## Step 7: Check Database Has Data

Connect to your database and check:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check if data exists
SELECT COUNT(*) FROM regions;
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM items;
```

If tables don't exist, load the schema:
```bash
psql -h your-rds-endpoint.rds.amazonaws.com -U your_username -d utweet -f database/schema.sql
```

## Step 8: Check CloudWatch Logs

1. Go to AWS CloudWatch Console
2. Find log group: `/aws/amplify/your-app-name`
3. Look for recent errors
4. Search for "DATABASE_URL" or "connection" errors

## Quick Diagnostic Commands

Run these to check your setup:

```bash
# 1. Check if DATABASE_URL is in your local .env (for reference)
cat .env.local | grep DATABASE_URL

# 2. Test local connection (if you have psql)
psql $DATABASE_URL -c "SELECT version();"

# 3. Verify your RDS endpoint
# Go to RDS Console → Your DB → Connectivity & security → Endpoint
```

## Most Likely Solutions (in order)

1. **DATABASE_URL not set in Amplify** → Add it in Environment variables
2. **RDS Security Group blocking** → Allow PostgreSQL port 5432
3. **Wrong DATABASE_URL format** → Check username, password, hostname, database name
4. **Database tables don't exist** → Load schema.sql
5. **Database has no data** → Load sample_data.sql

## After Fixing

1. **Redeploy** your Amplify app (or wait for auto-deploy if you changed env vars)
2. **Wait 5-10 minutes** for deployment
3. **Test again**: `https://main.djbnvyhjyy403.amplifyapp.com/api/regions`
4. **Check health endpoint**: `https://main.djbnvyhjyy403.amplifyapp.com/api/health`

## Still Not Working?

Share:
1. What you see at `/api/health` endpoint
2. What the error response shows (the JSON with code and hint)
3. Whether DATABASE_URL is set in Amplify Console
4. Whether you can connect to RDS from your local machine

