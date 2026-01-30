# Application Folder Structure

This document shows the folder structure of your uTweet application as deployed to AWS Amplify.

## Main Application Structure

```
utweet/
├── app/                          # Next.js App Router directory
│   ├── admin/
│   │   └── page.tsx             # Admin dashboard page
│   ├── api/                      # API routes
│   │   ├── categories/
│   │   │   ├── [id]/
│   │   │   │   └── route.ts     # Category CRUD operations
│   │   │   └── route.ts         # List/create categories
│   │   ├── countries/
│   │   │   └── route.ts         # Country listing
│   │   ├── health/
│   │   │   └── route.ts         # Health check endpoint
│   │   ├── items/
│   │   │   ├── [id]/
│   │   │   │   ├── interaction/
│   │   │   │   │   └── route.ts # Item interactions
│   │   │   │   ├── like/
│   │   │   │   │   └── route.ts # Like item
│   │   │   │   ├── rate/
│   │   │   │   │   └── route.ts # Rate item
│   │   │   │   └── route.ts     # Item CRUD operations
│   │   │   └── route.ts         # List/create items
│   │   ├── news/
│   │   │   └── route.ts         # News articles API
│   │   ├── photos/
│   │   │   ├── [id]/
│   │   │   │   ├── grok/
│   │   │   │   │   └── route.ts # AI photo analysis
│   │   │   │   ├── like/
│   │   │   │   │   └── route.ts # Like photo
│   │   │   │   └── route.ts     # Photo operations
│   │   │   ├── admin/
│   │   │   │   └── route.ts     # Admin photo management
│   │   │   └── route.ts         # Public photo listing/upload
│   │   └── regions/
│   │       └── route.ts         # Region listing
│   ├── globals.css              # Global CSS styles
│   ├── layout.tsx               # Root layout component
│   ├── page.tsx                 # Homepage
│   └── styles.css               # Custom CSS (replaces Tailwind)
│
├── components/                   # React components
│   ├── GrokDialog.tsx           # AI analysis dialog
│   ├── Header.tsx               # Site header/navigation
│   ├── ItemCard.tsx             # Item display card
│   ├── Logo.tsx                 # Logo component
│   ├── NewsSection.tsx          # News display component
│   ├── PhotoGallery.tsx         # Photo gallery component
│   ├── PhotoUploadDialog.tsx    # Photo upload dialog
│   ├── RegionFilter.tsx         # Region/country filter
│   ├── Section.tsx              # Category section component
│   └── StarRating.tsx          # Star rating component
│
├── lib/                          # Shared libraries
│   ├── db.ts                    # Database connection pool
│   └── types.ts                 # TypeScript type definitions
│
├── public/                       # Static files
│   └── uploads/                 # User-uploaded photos
│
├── database/                     # Database scripts (not deployed)
│   ├── schema.sql               # Database schema
│   ├── sample_data.sql          # Sample data
│   ├── migration_*.sql          # Migration scripts
│   └── *.js                     # Database utility scripts
│
├── amplify.yml                   # AWS Amplify build configuration
├── next.config.js               # Next.js configuration
├── package.json                 # Dependencies and scripts
├── postcss.config.js            # PostCSS configuration
├── tsconfig.json                # TypeScript configuration
└── README.md                    # Project documentation
```

## Key Directories Explained

### `/app`
Next.js 14 App Router structure. Each folder represents a route:
- `/app/page.tsx` → Homepage (`/`)
- `/app/admin/page.tsx` → Admin page (`/admin`)
- `/app/api/*/route.ts` → API endpoints (`/api/*`)

### `/components`
Reusable React components used across the application.

### `/lib`
Shared utilities:
- `db.ts` - PostgreSQL connection pool
- `types.ts` - TypeScript interfaces and types

### `/public`
Static assets served directly. The `uploads/` folder contains user-uploaded photos.

### `/database`
Database migration and setup scripts (not deployed to Amplify, used locally).

## How to View in AWS Amplify Console

1. **Go to AWS Amplify Console**: https://console.aws.amazon.com/amplify
2. **Select your app**: Click on your uTweet app
3. **View Build Logs**: 
   - Click on a build in the "Build history" section
   - The build logs show the file structure during build
4. **View Deployed Files**:
   - Go to "App settings" → "Build settings"
   - The `amplify.yml` file shows what gets built
   - Files are deployed to AWS Lambda (for API routes) and CloudFront (for static assets)

## Note

The `node_modules/` folder is not deployed. Only the built output (`.next/` folder) and source files are deployed. The build process happens on AWS Amplify's servers.

