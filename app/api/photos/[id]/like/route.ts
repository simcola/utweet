import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip.trim();
}

// POST - Like a photo (one per user)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = parseInt(params.id);
    const clientIP = getClientIP(request);

    // Check if photo exists and is approved
    const photoCheck = await pool.query(
      'SELECT id, approved FROM photos WHERE id = $1',
      [photoId]
    );

    if (photoCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    if (!photoCheck.rows[0].approved) {
      return NextResponse.json(
        { error: 'Photo is not approved' },
        { status: 403 }
      );
    }

    // Insert like (will fail silently if already liked due to UNIQUE constraint)
    await pool.query(
      `INSERT INTO photo_likes (photo_id, user_ip)
       VALUES ($1, $2)
       ON CONFLICT (photo_id, user_ip) DO NOTHING`,
      [photoId, clientIP]
    );

    // Update likes count
    const likeCount = await pool.query(
      'SELECT COUNT(*) as count FROM photo_likes WHERE photo_id = $1',
      [photoId]
    );

    await pool.query(
      'UPDATE photos SET likes = $1 WHERE id = $2',
      [parseInt(likeCount.rows[0].count), photoId]
    );

    return NextResponse.json({ 
      success: true,
      likes: parseInt(likeCount.rows[0].count)
    });
  } catch (error) {
    console.error('Error liking photo:', error);
    return NextResponse.json(
      { error: 'Failed to like photo' },
      { status: 500 }
    );
  }
}







