# Fix: DATABASE_URL Not Reaching Lambda in AWS Amplify

## The Problem
Even though you set `DATABASE_URL` in Amplify Console, it's not reaching the Lambda function running your Next.js API routes.

## Solution Steps

### Step 1: Verify Variable is Set in Amplify
1. Go to **AWS Amplify Console** → Your App
2. Click **"Environment variables"**
3. Verify `DATABASE_URL` exists with value:
   ```
   postgresql://utweet_admin:uTweet11!@utweet-db.ch8c86aka86t.us-east-2.rds.amazonaws.com:5432/utweet
   ```

### Step 2: Check Which Branch/Environment
- Make sure you're setting the variable for the **correct branch** (likely `main`)
- Amplify can have different variables per branch

### Step 3: Force Complete Redeploy
After setting/changing the variable:

**Option A: Push Empty Commit (Recommended)**
```bash
git commit --allow-empty -m "Force redeploy for DATABASE_URL"
git push origin main
```

**Option B: In Amplify Console**
1. Go to **"Build history"**
2. Click **"Clear cache and deploy"** (if available)
3. OR click latest build → **"Redeploy this version"**

### Step 4: Verify in Build Logs
After deployment starts:
1. Go to **"Build history"** → Latest build
2. Look for the preBuild phase
3. You should see: `DATABASE_URL is set: YES`

If it says `NO`, the variable isn't being passed to the build.

## Common Issues

### Issue 1: Variable Set for Wrong Branch
- Check which branch is deployed (usually `main`)
- Set the variable for that specific branch

### Issue 2: Variable Name Typo
- Must be exactly: `DATABASE_URL` (all caps, underscore)
- Not: `database_url`, `DATABASE-URL`, etc.

### Issue 3: Special Characters in Password
If password has `!`, try URL encoding:
```
postgresql://utweet_admin:uTweet11%21@utweet-db.ch8c86aka86t.us-east-2.rds.amazonaws.com:5432/utweet
```

### Issue 4: Variable Not Persisting
- Make sure you click **"Save"** after adding/editing
- Check that it appears in the list after saving

## Alternative: Set in amplify.yml (Not Recommended)

You could hardcode it in `amplify.yml`, but this is **NOT SECURE**:
```yaml
preBuild:
  commands:
    - export DATABASE_URL="postgresql://..."
```

**Don't do this** - it exposes your password in your code repository.

## Verification

After redeploying, check:
1. **Build logs** show `DATABASE_URL is set: YES`
2. **Health endpoint**: `https://main.djbnvyhjyy403.amplifyapp.com/api/health`
   - Should show `"database_url_set": true`
3. **API endpoints** return data instead of 500 errors

## Still Not Working?

1. **Double-check Amplify Console**:
   - App settings → Environment variables
   - Make sure variable is there
   - Make sure you're looking at the right app/branch

2. **Check AWS Systems Manager Parameter Store**:
   - Sometimes Amplify stores variables there
   - Go to AWS Console → Systems Manager → Parameter Store
   - Look for parameters related to your Amplify app

3. **Contact AWS Support**:
   - If variable is set but not reaching Lambda, it might be an Amplify bug
   - Provide them with your app ID and the issue

## Quick Test

After setting variable and redeploying, the build logs should show:
```
Checking environment variables...
DATABASE_URL is set: YES
```

If it shows `NO`, the variable isn't being passed correctly.

