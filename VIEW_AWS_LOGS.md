# How to View Console Logs in AWS Amplify

## Method 1: CloudWatch Logs (Recommended)

### Step 1: Access CloudWatch
1. Go to **AWS Console**: https://console.aws.amazon.com/
2. Search for **"CloudWatch"** in the search bar
3. Click on **CloudWatch**

### Step 2: Find Your Amplify Logs
1. In CloudWatch, click **"Logs"** in the left sidebar
2. Click **"Log groups"**
3. Look for log groups starting with:
   - `/aws/amplify/your-app-name`
   - Or search for "amplify" in the filter box

### Step 3: View Logs
1. Click on the log group (e.g., `/aws/amplify/utweet-main-xxxxx`)
2. You'll see log streams (one per deployment/build)
3. Click on the most recent log stream
4. You'll see all `console.log()` and `console.error()` output

### Step 4: Filter Logs
- Use the search box to filter for specific terms:
  - `DATABASE_URL`
  - `Error`
  - `connection`
  - `ECONNREFUSED`
  - `28P01`

## Method 2: Amplify Console (Easier)

### Step 1: Go to Amplify Console
1. Go to **AWS Amplify Console**: https://console.aws.amazon.com/amplify/
2. Click on your app

### Step 2: View Build Logs
1. Click **"Build history"** in the left sidebar
2. Click on the most recent build
3. Scroll through the build logs to see:
   - Build output
   - Runtime errors
   - Console logs from your application

### Step 3: View Runtime Logs
1. In Amplify Console, click **"Monitoring"** in the left sidebar
2. Click **"View logs in CloudWatch"** (if available)
3. This takes you directly to CloudWatch logs

## Method 3: Real-Time Logs (During Development)

### Using AWS CLI
```bash
# Install AWS CLI if you haven't
# Then configure it with your credentials

# Tail logs in real-time
aws logs tail /aws/amplify/your-app-name --follow
```

## What to Look For

### Database Connection Errors:
```
Error fetching regions: connection refused
Error: DATABASE_URL environment variable is not set
Error: password authentication failed
Error: database "utweet" does not exist
```

### Common Error Codes:
- `ECONNREFUSED` - Connection refused (security group or wrong hostname)
- `28P01` - Authentication failed (wrong username/password)
- `3D000` - Database does not exist (wrong database name)
- `ENOTFOUND` - Hostname not found (wrong endpoint)

## Quick Access Links

1. **CloudWatch Logs**: https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#logsV2:log-groups
2. **Amplify Console**: https://console.aws.amazon.com/amplify/
3. **Filter by your app name** in CloudWatch to find the right log group

## Tips

1. **Log Group Names**: Usually formatted as `/aws/amplify/app-name-branch-xxxxx`
2. **Most Recent**: Look for log streams with the latest timestamp
3. **Search**: Use Ctrl+F (Cmd+F on Mac) to search within logs
4. **Time Range**: Adjust the time range filter to see recent logs only

## Example: Finding Your Specific Logs

1. Go to CloudWatch → Logs → Log groups
2. Search for: `amplify` or your app name
3. Click on the log group
4. Click on the most recent log stream (sorted by "Last event time")
5. Look for errors related to:
   - Database connection
   - Environment variables
   - API route errors

## If You Can't Find Logs

1. **Check Region**: Make sure you're in the same AWS region as your Amplify app (us-east-2 based on your RDS)
2. **Check Permissions**: Ensure your AWS user has CloudWatch read permissions
3. **Check if App is Deployed**: Logs only exist after at least one deployment

