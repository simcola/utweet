# How to Deploy Changes to AWS Amplify

AWS Amplify automatically deploys your application when you push changes to your Git repository. Here's how to do it:

## Step 1: Commit Your Changes

First, make sure all your changes are committed to Git:

```bash
# Check what files have changed
git status

# Add all changed files
git add .

# Or add specific files
git add app/api/health/route.ts
git add app/api/categories/route.ts

# Commit with a descriptive message
git commit -m "Add health check endpoint and improve error handling"
```

## Step 2: Push to Your Git Repository

Push your changes to the repository that Amplify is connected to:

```bash
# Push to main branch (or master, depending on your setup)
git push origin main

# Or if your default branch is master
git push origin master
```

## Step 3: Amplify Automatically Deploys

Once you push to Git, AWS Amplify will:

1. **Detect the push** automatically
2. **Start a new build** (you'll see this in Amplify Console)
3. **Deploy** the new version when build completes

You can watch the progress in the AWS Amplify Console.

## Step 4: Monitor Deployment

1. **Go to AWS Amplify Console**
   - Navigate to: https://console.aws.amazon.com/amplify/
   - Click on your app

2. **Check Build History**
   - Click "Build history" in the left sidebar
   - You'll see the latest build with status (Building, Deploying, Success, or Failed)

3. **View Build Logs**
   - Click on a build to see detailed logs
   - Check for any errors or warnings

## Manual Redeploy (If Needed)

If you need to trigger a deployment without pushing code:

1. **Go to Amplify Console** → Your App
2. **Click "Redeploy this version"** on any previous build
   - Or go to "Build settings" → "Redeploy"

## Quick Deployment Checklist

Before pushing, make sure:

- [ ] All changes are committed (`git status` shows nothing)
- [ ] You've tested locally (`npm run build` succeeds)
- [ ] Environment variables are set in Amplify Console
- [ ] No sensitive data in committed files (check `.gitignore`)

## Common Commands

```bash
# Check current status
git status

# See what will be committed
git diff --staged

# Commit all changes
git add .
git commit -m "Your commit message"
git push origin main

# If you need to update remote branch name
git branch -M main
git push -u origin main
```

## Troubleshooting

### Build Fails After Push

1. **Check Build Logs** in Amplify Console
2. **Common Issues:**
   - TypeScript errors → Fix in your code
   - Missing dependencies → Check `package.json`
   - Environment variables → Set in Amplify Console
   - Database connection → Check `DATABASE_URL`

### Changes Not Showing

1. **Wait for build to complete** (can take 5-10 minutes)
2. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check you're looking at the right branch** (main/master)
4. **Verify deployment succeeded** in Amplify Console

### Need to Rollback

1. Go to Amplify Console → Build history
2. Find the previous working build
3. Click "Redeploy this version"

## Environment Variables

**Important**: Environment variables are NOT in Git. Set them in Amplify Console:

1. Go to Amplify Console → Your App
2. Click "Environment variables" in left sidebar
3. Add/Edit variables:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `NODE_ENV`

After changing environment variables, **redeploy** your app.

## Current Changes to Deploy

Based on recent updates, you should commit and push:

- ✅ `app/api/health/route.ts` (new health check endpoint)
- ✅ `app/api/categories/route.ts` (improved error handling)
- ✅ Any other modified files

## Quick Deploy Script

You can create a simple script to deploy:

```bash
#!/bin/bash
# deploy.sh

echo "Checking git status..."
git status

echo "Adding all changes..."
git add .

echo "Committing..."
git commit -m "Deploy latest changes"

echo "Pushing to origin..."
git push origin main

echo "✅ Changes pushed! Check Amplify Console for deployment status."
```

Save as `deploy.sh`, make executable (`chmod +x deploy.sh`), then run `./deploy.sh`

