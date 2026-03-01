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

// Return a small URL for list responses to avoid 413 (response too large) when image_url is base64
function imageUrlForResponse(id: number, storedUrl: string | null): string {
  if (!storedUrl) return '';
  if (storedUrl.startsWith('data:')) return `/api/photos/${id}/image`;
  return storedUrl;
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
      // Photo of the month = approved photo from last 30 days with the most likes (from photo_likes table)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await pool.query(
        `SELECT 
          p.*,
          COUNT(pl.id) AS like_count
        FROM photos p
        LEFT JOIN photo_likes pl ON p.id = pl.photo_id
        WHERE p.approved = true 
          AND p.created_at >= $1
        GROUP BY p.id
        ORDER BY like_count DESC, p.created_at DESC
        LIMIT 1`,
        [thirtyDaysAgo]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(null);
      }

      const photo = result.rows[0];
      const clientIP = getClientIP(request);
      const actualLikeCount = parseInt(photo.like_count) || 0;

      const likeCheck = await pool.query(
        'SELECT id FROM photo_likes WHERE photo_id = $1 AND user_ip = $2',
        [photo.id, clientIP]
      );

      return NextResponse.json({
        ...photo,
        image_url: imageUrlForResponse(photo.id, photo.image_url),
        species: photo.species,
        airesponse: photo.airesponse,
        likes: actualLikeCount,
        is_liked: likeCheck.rows.length > 0,
      });
    } else {
      // Get approved photos: optional ?all=1 for all time, otherwise last 30 days
      const showAll = searchParams.get('all') === '1';

      let result;
      if (showAll) {
        result = await pool.query(
          `SELECT 
            p.*,
            COUNT(pl.id) as like_count
          FROM photos p
          LEFT JOIN photo_likes pl ON p.id = pl.photo_id
          WHERE p.approved = true
          GROUP BY p.id
          ORDER BY p.created_at DESC`
        );
      } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        result = await pool.query(
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
      }

      const clientIP = getClientIP(request);
      
      // Get all photos user has liked
      const userLikes = await pool.query(
        'SELECT photo_id FROM photo_likes WHERE user_ip = $1',
        [clientIP]
      );
      const likedPhotoIds = new Set(userLikes.rows.map((row: any) => row.photo_id));

      const photos: Photo[] = result.rows.map((row: any) => ({
        id: row.id,
        image_url: imageUrlForResponse(row.id, row.image_url),
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
    const username = (formData.get('username') as string)?.trim() ?? '';
    const email = (formData.get('email') as string)?.trim() ?? '';
    const location = formData.get('location') as string;
    const species = formData.get('species') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Please select a photo to upload' },
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
    
    // Read file once (FormData file can only be consumed once in some runtimes)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Check if we're on AWS Lambda/Amplify or other serverless platform
    // On serverless, filesystem is read-only except /tmp, and /tmp is ephemeral
    const cwd = process.cwd();
    const isServerless = !!(
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.AWS_EXECUTION_ENV ||
      process.env.AWS_REGION ||           // Set on any AWS Lambda/Amplify
      process.env.AMPLIFY === 'true' ||   // Amplify Hosting
      process.env.VERCEL ||
      cwd.startsWith('/tmp') ||
      cwd.includes('/tmp/')
    );

    let imageUrl: string;

    if (isServerless) {
      // On serverless (AWS Lambda/Amplify/Vercel), store as base64 in DB
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      imageUrl = dataUrl;
      if (dataUrl.length > 100000) {
        console.log(`Base64 image length: ${dataUrl.length}. Ensure photos.image_url is TEXT, not VARCHAR(500).`);
      }
    } else {
      // Local development - try to save to public/uploads; fall back to base64 if write fails
      try {
        if (cwd.startsWith('/tmp')) throw new Error('Cannot write to /tmp');
        const uploadsDir = join(process.cwd(), 'public', 'uploads');
        if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true });
        const filepath = join(uploadsDir, filename);
        await writeFile(filepath, buffer);
        imageUrl = `/uploads/${filename}`;
      } catch (fileError: any) {
        console.warn('Failed to write file to disk, using base64:', fileError.message);
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
      isServerless
    });

    const uploadedPhoto = result.rows[0];
    console.log('Photo uploaded successfully to database:', {
      id: uploadedPhoto.id,
      username: uploadedPhoto.username,
      approved: uploadedPhoto.approved
    });

    return NextResponse.json(uploadedPhoto, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading photo:', error);
    const errorMessage = error?.message ?? 'Unknown error';
    const pgCode = error?.code;
    const hint =
      pgCode === '22001'
        ? 'Database column too small: run migration to change photos.image_url to TEXT (see database/run_image_url_migration.js).'
        : undefined;

    return NextResponse.json(
      {
        error: 'Failed to upload photo',
        message: errorMessage,
        code: pgCode,
        hint,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
      { status: 500 }
    );
  }
}

