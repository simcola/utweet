# Fix: DATABASE_URL environment variable is not set

## The Error:
```
Error: DATABASE_URL environment variable is not set
```

This means Amplify isn't passing the environment variable to your Lambda function.

## Solution: Set Environment Variable in Amplify

### Step 1: Go to Amplify Console
1. Go to: https://console.aws.amazon.com/amplify/
2. Click on your app

### Step 2: Add Environment Variable
1. Click **"Environment variables"** in the left sidebar
2. Click **"Manage variables"** button
3. Click **"Add variable"** (if DATABASE_URL doesn't exist)
   - OR click **Edit** if it already exists

### Step 3: Set the Value
- **Key**: `DATABASE_URL`
- **Value**: 
  ```
  postgresql://utweet_admin:uTweet11!@utweet-db.ch8c86aka86t.us-east-2.rds.amazonaws.com:5432/utweet
  ```
- Click **"Save"**

### Step 4: IMPORTANT - Redeploy
**This is critical!** After adding/changing environment variables, you MUST redeploy:

1. Go to **"Build history"** in the left sidebar
2. Click on the most recent build
3. Click **"Redeploy this version"** button
   - OR go to **"Deployments"** → **"Redeploy"**

**Wait 5-10 minutes** for the redeployment to complete.

## Verify It's Set

After redeployment, check:
1. Visit: `https://main.djbnvyhjyy403.amplifyapp.com/api/health`
2. Should show `"database_url_set": true`
3. Should show database connection status

## Common Mistakes

1. **Not redeploying** - Environment variables only take effect after redeployment
2. **Wrong variable name** - Must be exactly `DATABASE_URL` (case-sensitive)
3. **Missing port/database** - Must include `:5432/utweet` at the end
4. **Special characters in password** - May need URL encoding

## If Still Not Working

1. **Double-check the variable name**: Must be `DATABASE_URL` (all caps, underscore)
2. **Check for typos** in the connection string
3. **Verify redeployment completed** - Check build history shows "Success"
4. **Try URL encoding the password** if it has special characters:
   ```
   postgresql://utweet_admin:uTweet11%21@utweet-db.ch8c86aka86t.us-east-2.rds.amazonaws.com:5432/utweet
   ```
   (Where `!` becomes `%21`)

## Quick Checklist

- [ ] DATABASE_URL is set in Amplify Environment variables
- [ ] Value includes port `:5432`
- [ ] Value includes database name `/utweet`
- [ ] App has been redeployed after setting the variable
- [ ] Redeployment completed successfully (check build history)
- [ ] Tested `/api/health` endpoint after redeployment

