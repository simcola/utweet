# Fix Your DATABASE_URL

## Current (Incorrect):
```
postgresql://utweet_admin:uTweet11!@utweet-db.ch8c86aka86t.us-east-2.rds.amazonaws.com
```

## Correct Format:
```
postgresql://utweet_admin:uTweet11!@utweet-db.ch8c86aka86t.us-east-2.rds.amazonaws.com:5432/utweet
```

## What's Missing:
1. **Port**: `:5432` (PostgreSQL default port)
2. **Database name**: `/utweet` (or whatever you named your database)

## Important: Password with Special Characters

Your password contains `!` which might need URL encoding. If the connection still fails, try:

```
postgresql://utweet_admin:uTweet11%21@utweet-db.ch8c86aka86t.us-east-2.rds.amazonaws.com:5432/utweet
```

Where `!` is encoded as `%21`

## Steps to Fix in AWS Amplify:

1. Go to AWS Amplify Console → Your App
2. Click "Environment variables"
3. Find `DATABASE_URL` (or add it if missing)
4. Update the value to:
   ```
   postgresql://utweet_admin:uTweet11!@utweet-db.ch8c86aka86t.us-east-2.rds.amazonaws.com:5432/utweet
   ```
5. Click "Save"
6. **Redeploy** your app (or wait for auto-deploy)

## Verify Database Name

If your database isn't named `utweet`, replace it with the actual name. To check:
- Go to RDS Console → Your Database → Configuration tab
- Look for "DB name" or check the connection string in RDS

## Test the Connection

After updating, test:
1. Visit: `https://main.djbnvyhjyy403.amplifyapp.com/api/health`
2. Should show database connection status
3. Or visit: `https://main.djbnvyhjyy403.amplifyapp.com/api/regions`
4. Should return data (not 500 error)

