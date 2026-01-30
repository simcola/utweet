import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Photo } from '@/lib/types';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Configure route to handle larger file uploads
export const runtime = 'nodejs';
export const maxDuration = 30;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip.trim();
}

// GET - List approved photos from last 30 days
export async function GET(request: NextRequest) {
  try {
    // Check if photos table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'photos'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      // Photos table doesn't exist, return empty array
      return NextResponse.json([]);
    }
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'month' for photo of the month, null for gallery
    
    if (type === 'month') {
      // Get photo of the month (most likes in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await pool.query(
        `SELECT 
          p.*
        FROM photos p
        WHERE p.approved = true 
          AND p.created_at >= $1
        ORDER BY p.likes DESC, p.created_at DESC
        LIMIT 1`,
        [thirtyDaysAgo]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(null);
      }

      const photo = result.rows[0];
      const clientIP = getClientIP(request);
      
      // Get actual like count from photo_likes table
      const likeCountResult = await pool.query(
        'SELECT COUNT(*) as count FROM photo_likes WHERE photo_id = $1',
        [photo.id]
      );
      const actualLikeCount = parseInt(likeCountResult.rows[0].count) || 0;
      
      // Check if user has liked this photo
      const likeCheck = await pool.query(
        'SELECT id FROM photo_likes WHERE photo_id = $1 AND user_ip = $2',
        [photo.id, clientIP]
      );

      return NextResponse.json({
        ...photo,
        species: photo.species,
        airesponse: photo.airesponse,
        likes: actualLikeCount,
        is_liked: likeCheck.rows.length > 0,
      });
    } else {
      // Get all approved photos from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await pool.query(
        `SELECT 
          p.*,
          COUNT(pl.id) as like_count
        FROM photos p
        LEFT JOIN photo_likes pl ON p.id = pl.photo_id
        WHERE p.approved = true 
          AND p.created_at >= $1
        GROUP BY p.id
        ORDER BY p.created_at DESC`,
        [thirtyDaysAgo]
      );

      const clientIP = getClientIP(request);
      
      // Get all photos user has liked
      const userLikes = await pool.query(
        'SELECT photo_id FROM photo_likes WHERE user_ip = $1',
        [clientIP]
      );
      const likedPhotoIds = new Set(userLikes.rows.map((row: any) => row.photo_id));

      const photos: Photo[] = result.rows.map((row: any) => ({
        id: row.id,
        image_url: row.image_url,
        username: row.username,
        email: row.email,
        location: row.location,
        species: row.species,
        airesponse: row.airesponse,
        likes: parseInt(row.like_count) || 0,
        approved: row.approved,
        created_at: row.created_at,
        is_liked: likedPhotoIds.has(row.id),
      }));

      return NextResponse.json(photos);
    }
  } catch (error: any) {
    console.error('Error fetching photos:', error);
    // If table doesn't exist, return empty array instead of error
    if (error.code === '42P01') {
      return NextResponse.json([]);
    }
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

// POST - Upload a new photo
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const location = formData.get('location') as string;
    const species = formData.get('species') as string;

    if (!file || !username || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filepath = join(uploadsDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Save to database
    const imageUrl = `/uploads/${filename}`;
    const result = await pool.query(
      `INSERT INTO photos (image_url, username, email, location, species, approved)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [imageUrl, username, email, location || null, species || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

