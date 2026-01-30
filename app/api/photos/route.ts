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
    try {
      await pool.query('SELECT 1 FROM photos LIMIT 1');
    } catch (tableError: any) {
      if (tableError.code === '42P01') {
        // Table doesn't exist
        console.error('Photos table does not exist. Run the migration script.');
        return NextResponse.json(
          { error: 'Photos table does not exist. Please run the database migration.' },
          { status: 500 }
        );
      }
      throw tableError;
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
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

// POST - Upload a new photo
export async function POST(request: NextRequest) {
  try {
    // Check if photos table exists
    try {
      await pool.query('SELECT 1 FROM photos LIMIT 1');
    } catch (tableError: any) {
      if (tableError.code === '42P01') {
        // Table doesn't exist
        console.error('Photos table does not exist. Run the migration script.');
        return NextResponse.json(
          { error: 'Photos table does not exist. Please run the database migration.' },
          { status: 500 }
        );
      }
      throw tableError;
    }

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

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    // Check if we're on AWS Lambda/Amplify or other serverless platform
    // On serverless, filesystem is read-only except /tmp, and /tmp is ephemeral
    // So we'll always use base64 storage on serverless platforms
    const cwd = process.cwd();
    const isServerless = !!(
      process.env.AWS_LAMBDA_FUNCTION_NAME || 
      process.env.AWS_EXECUTION_ENV || 
      process.env.VERCEL ||
      cwd.startsWith('/tmp') ||  // AWS Lambda uses /tmp/app
      cwd.includes('/tmp/')      // Other serverless platforms
    );
    
    let imageUrl: string;
    
    if (isServerless) {
      // On serverless (AWS Lambda/Amplify/Vercel), convert image to base64 and store in database
      // This is a temporary solution - for production, use S3
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      imageUrl = dataUrl;
      
      console.log('Serverless environment detected - storing image as base64');
    } else {
      // Local development - try to save to public/uploads
      // But if it fails (e.g., on serverless that wasn't detected), fall back to base64
      try {
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        
        // Double-check: if we're in /tmp, don't try to create directories
        if (cwd.startsWith('/tmp')) {
          throw new Error('Cannot write to /tmp directory structure');
        }
        
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true });
        }
        
        const filepath = join(uploadsDir, filename);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);
        
        imageUrl = `/uploads/${filename}`;
        console.log('File saved to:', filepath);
      } catch (fileError: any) {
        // If file write fails (e.g., on serverless), fall back to base64
        console.warn('Failed to write file to disk, using base64 storage:', fileError.message);
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString('base64');
        imageUrl = `data:${file.type};base64,${base64}`;
      }
    }

    // Save to database
    const result = await pool.query(
      `INSERT INTO photos (image_url, username, email, location, species, approved)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [imageUrl, username, email, location || null, species || null]
    );

    console.log('Photo uploaded successfully:', {
      id: result.rows[0].id,
      username,
      imageUrl: imageUrl.substring(0, 50) + '...',
      isAWS
    });

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error uploading photo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        error: 'Failed to upload photo',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error as any).stack : undefined
      },
      { status: 500 }
    );
  }
}

