import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip.trim();
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = parseInt(params.id);
    const clientIP = getClientIP(request);

    const [likeResult, ratingResult] = await Promise.all([
      pool.query(
        'SELECT 1 FROM likes WHERE item_id = $1 AND user_ip = $2',
        [itemId, clientIP]
      ),
      pool.query(
        'SELECT rating FROM ratings WHERE item_id = $1 AND user_ip = $2',
        [itemId, clientIP]
      ),
    ]);

    return NextResponse.json({
      is_liked: likeResult.rows.length > 0,
      user_rating: ratingResult.rows[0]?.rating || 0,
    });
  } catch (error) {
    console.error('Error checking interaction:', error);
    return NextResponse.json(
      { error: 'Failed to check interaction' },
      { status: 500 }
    );
  }
}

