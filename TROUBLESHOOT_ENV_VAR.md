# Troubleshooting: DATABASE_URL Still Not Set

If you're still getting the error after setting the variable, try these steps:

## Step 1: Verify Variable is Set Correctly

1. Go to **AWS Amplify Console** → Your App
2. Click **"Environment variables"**
3. **Verify**:
   - Variable name is exactly: `DATABASE_URL` (all caps, underscore, no spaces)
   - Value is set (not empty)
   - No extra spaces before/after the value

## Step 2: Check Build Settings

1. In Amplify Console, click **"Build settings"**
2. Look for `amplify.yml` or build configuration
3. Verify environment variables are being passed to the build

## Step 3: Force a Complete Redeploy

Sometimes a simple redeploy isn't enough. Try:

1. **Option A: Trigger New Build**
   - Go to **"Build settings"**
   - Click **"Redeploy this version"** on the latest build
   - Wait for it to complete

2. **Option B: Push a New Commit** (Recommended)
   ```bash
   # Make a small change to trigger rebuild
   git commit --allow-empty -m "Trigger rebuild for environment variables"
   git push origin main
   ```

3. **Option C: Clear Cache and Redeploy**
   - Go to **"Build settings"**
   - Click **"Clear cache and deploy"**

## Step 4: Verify Variable Name

Common mistakes:
- ❌ `database_url` (lowercase)
- ❌ `DATABASE-URL` (hyphen instead of underscore)
- ❌ `DATABASE URL` (space instead of underscore)
- ✅ `DATABASE_URL` (correct)

## Step 5: Check for Multiple Environments

If you have multiple branches/environments:
1. Make sure you're setting the variable for the **correct branch**
2. Check if you have `main`, `master`, or other branches
3. Set the variable for the branch that's deployed

## Step 6: Verify in Build Logs

After redeploying, check build logs:
1. Go to **"Build history"**
2. Click the latest build
3. Search for `DATABASE_URL` in the logs
4. You should see it being set during the build

## Step 7: Alternative - Use Next.js Environment Variables

If Amplify environment variables aren't working, you can try setting it in `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
}

module.exports = nextConfig
```

But this still requires the variable to be set in Amplify.

## Step 8: Check Amplify App Settings

1. Go to **"App settings"** → **"Environment variables"**
2. Make sure you're editing the **correct app** and **correct branch**
3. Check if there are any **conflicting variables** with similar names

## Most Common Issue: Not Redeployed

**90% of the time**, the issue is that the app wasn't redeployed after setting the variable.

**Solution**: After setting/changing environment variables, you MUST:
1. Wait for any in-progress builds to complete
2. Trigger a new deployment
3. Wait 5-10 minutes for deployment to complete
4. Test again

## Quick Test

After redeploying, test:
```
https://main.djbnvyhjyy403.amplifyapp.com/api/health
```

Should show:
```json
{
  "status": "ok",
  "checks": {
    "database_url_set": true,
    ...
  }
}
```

If it still shows `"database_url_set": false`, the variable isn't being passed correctly.

