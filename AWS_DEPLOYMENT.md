# AWS Deployment Guide for uTweet.com

This guide covers deploying your Next.js application to AWS. There are two main approaches:

1. **AWS Amplify** (Recommended - Easiest)
2. **EC2 Instance** (More control, more setup)

## Prerequisites

- AWS Account
- AWS CLI installed and configured (optional, but helpful)
- Git repository (GitHub, GitLab, or Bitbucket)
- Domain name (optional, but recommended)

---

## Option 1: AWS Amplify (Recommended)

AWS Amplify is the easiest way to deploy Next.js applications. It handles builds, deployments, and SSL certificates automatically.

### Step 1: Set Up RDS PostgreSQL Database

1. **Go to AWS RDS Console**
   - Navigate to: https://console.aws.amazon.com/rds/
   - Click "Create database"

2. **Choose Configuration**
   - **Engine**: PostgreSQL
   - **Version**: 15.x or 16.x (latest stable)
   - **Template**: Free tier (for testing) or Production
   - **DB Instance Identifier**: `utweet-db`
   - **Master Username**: `utweet_admin` (or your choice)
   - **Master Password**: Create a strong password (save it!)
   - **DB Instance Class**: `db.t3.micro` (free tier) or `db.t3.small` (production)

3. **Network & Security**
   - **VPC**: Default VPC (or create new)
   - **Public Access**: **Yes** (needed for Amplify connection)
   - **VPC Security Group**: Create new or use existing
   - **Database Port**: 5432

4. **Database Authentication**: Password authentication

5. **Additional Configuration**
   - **Initial Database Name**: `utweet`
   - **Backup Retention**: 7 days (or as needed)
   - **Enable Encryption**: Yes (recommended)

6. **Click "Create database"** (takes 5-10 minutes)

7. **Configure Security Group**
   - Once database is created, go to "Connectivity & security" tab
   - Click on the Security Group link
   - Click "Edit inbound rules"
   - Add rule:
     - **Type**: PostgreSQL
     - **Source**: `0.0.0.0/0` (for Amplify) OR specific IP/CIDR for security
     - **Port**: 5432
   - Save rules

8. **Get Connection String**
   - Go back to RDS instance
   - Copy the **Endpoint** (e.g., `utweet-db.xxxxx.us-east-1.rds.amazonaws.com`)
   - Your `DATABASE_URL` will be:
     ```
     postgresql://utweet_admin:uTweet11!@utweet-db.utweet-db.ch8c86aka86t.us-east-2.rds.amazonaws.com.us-east-1.rds.amazonaws.com:5432/utweet
     ```

### Step 2: Initialize Database Schema

1. **Connect to RDS from your local machine:**
   ```bash
   psql -h utweet-db.utweet-db.ch8c86aka86t.us-east-2.rds.amazonaws.com -U utweet_admin -d utweet
   ```

2. **Run schema:**
   ```bash
   psql -h utweet-db.xxxxx.us-east-1.rds.amazonaws.com -U utweet_admin -d utweet -f database/schema.sql
   ```

3. **Load sample data (optional):**
   ```bash
   psql -h utweet-db.xxxxx.us-east-1.rds.amazonaws.com -U utweet_admin -d utweet -f database/sample_data.sql
   ```

### Step 3: Push Code to Git Repository

1. **Initialize Git (if not already):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Push to GitHub/GitLab/Bitbucket:**
   ```bash
   git remote add origin https://github.com/yourusername/utweet.git
   git push -u origin main
   ```

### Step 4: Deploy to AWS Amplify

1. **Go to AWS Amplify Console**
   - Navigate to: https://console.aws.amazon.com/amplify/
   - Click "New app" → "Host web app"

2. **Connect Repository**
   - Choose your Git provider (GitHub, GitLab, Bitbucket)
   - Authorize AWS Amplify
   - Select your repository
   - Select branch (usually `main` or `master`)
   - Click "Next"

3. **Configure Build Settings**
   - Amplify should auto-detect Next.js
   - If not, use this build spec:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

4. **Environment Variables**
   - Click "Environment variables"
   - Add the following:
     ```
     DATABASE_URL=postgresql://utweet_admin:your_password@utweet-db.xxxxx.us-east-1.rds.amazonaws.com:5432/utweet
     NEXTAUTH_SECRET=your-random-secret-key-min-32-chars
     NEXTAUTH_URL=https://your-app-id.amplifyapp.com
     NODE_ENV=production
     ```
   - **Generate NEXTAUTH_SECRET:**
     ```bash
     openssl rand -base64 32
     ```
   - **Note**: Update `NEXTAUTH_URL` after first deployment with your actual Amplify URL

5. **Review and Deploy**
   - Click "Save and deploy"
   - Wait for build to complete (5-10 minutes)

6. **Update NEXTAUTH_URL**
   - After first deployment, copy your Amplify app URL
   - Go to "Environment variables"
   - Update `NEXTAUTH_URL` to your actual URL (e.g., `https://main.xxxxx.amplifyapp.com`)

### Step 5: Custom Domain (Optional)

1. **In Amplify Console:**
   - Go to "Domain management"
   - Click "Add domain"
   - Enter your domain name
   - Follow DNS configuration instructions
   - AWS will provide SSL certificate automatically

### Step 6: Update RDS Security Group for Amplify

1. **Get Amplify IP ranges** (if using IP restrictions):
   - Amplify uses dynamic IPs, so you may need to allow all IPs or use VPC peering
   - For simplicity, allow `0.0.0.0/0` with strong database password

---

## Option 2: EC2 Instance (More Control)

This approach gives you full control but requires more setup.

### Step 1: Set Up RDS PostgreSQL

Follow **Step 1** from Option 1 above.

### Step 2: Launch EC2 Instance

1. **Go to EC2 Console**
   - Navigate to: https://console.aws.amazon.com/ec2/
   - Click "Launch Instance"

2. **Choose Configuration**
   - **Name**: `utweet-server`
   - **AMI**: Amazon Linux 2023 or Ubuntu 22.04 LTS
   - **Instance Type**: `t3.micro` (free tier) or `t3.small`
   - **Key Pair**: Create new or use existing (save the `.pem` file!)
   - **Network Settings**: 
     - Allow HTTP (port 80)
     - Allow HTTPS (port 443)
     - Allow SSH (port 22) from your IP

3. **Launch Instance**

### Step 3: Connect to EC2 and Set Up

1. **SSH into instance:**
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-ip
   ```
   (For Ubuntu, use `ubuntu` instead of `ec2-user`)

2. **Update system:**
   ```bash
   sudo yum update -y  # Amazon Linux
   # OR
   sudo apt update && sudo apt upgrade -y  # Ubuntu
   ```

3. **Install Node.js 20.x:**
   ```bash
   # Amazon Linux
   curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
   sudo yum install -y nodejs
   
   # Ubuntu
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install PM2 (Process Manager):**
   ```bash
   sudo npm install -g pm2
   ```

5. **Install Nginx:**
   ```bash
   # Amazon Linux
   sudo yum install -y nginx
   
   # Ubuntu
   sudo apt install -y nginx
   ```

6. **Clone your repository:**
   ```bash
   git clone https://github.com/yourusername/utweet.git
   cd utweet
   npm install
   ```

7. **Create environment file:**
   ```bash
   nano .env.local
   ```
   Add:
   ```
   DATABASE_URL=postgresql://utweet_admin:your_password@utweet-db.xxxxx.us-east-1.rds.amazonaws.com:5432/utweet
   NEXTAUTH_SECRET=your-random-secret-key-min-32-chars
   NEXTAUTH_URL=http://your-ec2-ip-or-domain
   NODE_ENV=production
   ```

8. **Build application:**
   ```bash
   npm run build
   ```

9. **Start with PM2:**
   ```bash
   pm2 start npm --name "utweet" -- start
   pm2 save
   pm2 startup  # Follow instructions to enable auto-start
   ```

### Step 4: Configure Nginx Reverse Proxy

1. **Create Nginx config:**
   ```bash
   sudo nano /etc/nginx/conf.d/utweet.conf
   ```

2. **Add configuration:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com www.your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

3. **Test and restart Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   sudo systemctl enable nginx
   ```

### Step 5: Set Up SSL with Let's Encrypt

1. **Install Certbot:**
   ```bash
   # Amazon Linux
   sudo yum install -y certbot python3-certbot-nginx
   
   # Ubuntu
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. **Get SSL certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com -d www.your-domain.com
   ```

3. **Auto-renewal (already configured by certbot)**

### Step 6: Update RDS Security Group

1. **Allow EC2 instance to access RDS:**
   - Go to RDS Security Group
   - Add inbound rule:
     - **Type**: PostgreSQL
     - **Source**: Select your EC2 instance's security group
     - **Port**: 5432

---

## Post-Deployment Checklist

- [ ] Database schema loaded
- [ ] Sample data loaded (optional)
- [ ] Environment variables configured
- [ ] Application builds successfully
- [ ] Database connection works
- [ ] SSL certificate active (if using custom domain)
- [ ] Admin user created (if needed)
- [ ] Monitoring/alerts set up (optional)

## Security Best Practices

1. **Database Security:**
   - Use strong passwords
   - Restrict RDS security group to only necessary IPs/security groups
   - Enable encryption at rest
   - Regular backups

2. **Application Security:**
   - Keep dependencies updated
   - Use environment variables (never commit secrets)
   - Enable HTTPS only
   - Set up CloudWatch monitoring

3. **AWS Security:**
   - Use IAM roles with least privilege
   - Enable MFA on AWS account
   - Regular security audits

## Cost Estimation

**Free Tier (First 12 months):**
- RDS: `db.t3.micro` - Free (750 hours/month)
- EC2: `t3.micro` - Free (750 hours/month)
- Amplify: Free tier available
- Data Transfer: 1GB/month free

**After Free Tier:**
- RDS `db.t3.micro`: ~$15/month
- EC2 `t3.micro`: ~$8/month
- Amplify: Pay per build/deploy
- Data Transfer: ~$0.09/GB

## Troubleshooting

### Database Connection Issues
- Check RDS security group allows connections
- Verify `DATABASE_URL` is correct
- Check RDS is publicly accessible (if needed)

### Build Failures
- Check Node.js version (should be 18+)
- Verify all dependencies in `package.json`
- Check build logs in Amplify/EC2

### Application Not Starting
- Check PM2 logs: `pm2 logs utweet`
- Verify environment variables
- Check port 3000 is not in use

## Support Resources

- [AWS Amplify Docs](https://docs.aws.amazon.com/amplify/)
- [AWS RDS Docs](https://docs.aws.amazon.com/rds/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [AWS EC2 Docs](https://docs.aws.amazon.com/ec2/)

---

**Recommended Approach**: Start with **AWS Amplify** (Option 1) as it's the easiest and handles most infrastructure automatically. You can always migrate to EC2 later if you need more control.



