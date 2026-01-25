import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Photo } from '@/lib/types';

// GET - Get all photos (including unapproved) for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const approved = searchParams.get('approved'); // 'true', 'false', or null for all

    let query = `
      SELECT 
        p.*,
        COUNT(pl.id) as like_count
      FROM photos p
      LEFT JOIN photo_likes pl ON p.id = pl.photo_id
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (approved === 'true') {
      query += ` WHERE p.approved = $${paramCount++}`;
      params.push(true);
    } else if (approved === 'false') {
      query += ` WHERE p.approved = $${paramCount++}`;
      params.push(false);
    }

    query += ` GROUP BY p.id ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);

    const photos: Photo[] = result.rows.map((row: any) => ({
      id: row.id,
      image_url: row.image_url,
      username: row.username,
      email: row.email,
      location: row.location,
      likes: parseInt(row.like_count) || 0,
      approved: row.approved,
      created_at: row.created_at,
    }));

    return NextResponse.json(photos);
  } catch (error) {
    console.error('Error fetching photos for admin:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

