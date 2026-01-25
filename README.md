# uTweet.com - Bird Watcher Directory & Rating System

A modern Next.js application for bird watching enthusiasts featuring:
- Directory of birding resources organized by categories
- Regional filtering
- Like/unlike functionality
- Star ratings (1-5 stars)
- Admin interface for content management

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up PostgreSQL Database

1. Create a PostgreSQL database:
```sql
CREATE DATABASE utweet;
```

2. Run the schema file to create tables:
```bash
psql -U your_username -d utweet -f database/schema.sql
```

Or manually execute the SQL from `database/schema.sql`.

3. (Optional) Load sample data:
```bash
psql -U your_username -d utweet -f database/sample_data.sql
```

Or manually execute the SQL from `database/sample_data.sql`.

This seeds region and country-specific examples across all categories so the region/country filters on the home page have rich data to demonstrate.

**Note**: To create an admin user, generate a password hash first:
```bash
node database/generate_admin_password.js
```
Then insert the generated hash into the database using the SQL statement provided by the script.

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```
DATABASE_URL=postgresql://username:password@localhost:5432/utweet
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
GEMINI_API_KEY=your-gemini-api-key-here
```

**Note**: The Gemini API key enables bird photo identification features using Google's Gemini AI. To get your API key:
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Add it to your `.env.local` file as `GEMINI_API_KEY`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

### Main Features

- **Global & Regional Websites**: Discover birding websites worldwide or by region
- **Travel Resources**: Hotels, Nature Parks, Tour Operators
- **News**: Stay updated with birding news
- **Shopping**: Find binoculars, cameras, clothing, books & guides
- **Photo Gallery**: Upload and view bird photos with identification features
- **Bird Identification (AiID)**: AI-powered bird identification using Google Gemini AI
- **Admin Panel**: Manage categories and items at `/admin`

### User Features

- Filter content by region (All, North America, Europe, Asia, etc.)
- Like/unlike any entry
- Rate entries from 1-5 stars
- View average ratings and like counts
- Upload bird photos to the gallery
- Identify birds in photos using Google Gemini AI
- Modern, responsive UI

### Admin Features

- Add, edit, and delete items
- Organize items by category and region
- View all categories and their subcategories

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── admin/            # Admin dashboard
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home page
│   └── globals.css       # Global styles
├── components/           # React components
│   ├── Header.tsx
│   ├── Logo.tsx
│   ├── RegionFilter.tsx
│   ├── ItemCard.tsx
│   ├── StarRating.tsx
│   └── Section.tsx
├── lib/
│   ├── db.ts            # Database connection
│   └── types.ts         # TypeScript types
├── database/
│   └── schema.sql       # Database schema
└── README.md
```

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **Icons**: Lucide React

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

Make sure to set proper environment variables in your production environment.

