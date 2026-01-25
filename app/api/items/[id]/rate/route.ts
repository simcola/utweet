import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip.trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = parseInt(params.id);
    const body = await request.json();
    const { rating } = body;
    const clientIP = getClientIP(request);

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    await pool.query(
      `INSERT INTO ratings (item_id, user_ip, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (item_id, user_ip)
       DO UPDATE SET rating = $3`,
      [itemId, clientIP, rating]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rating item:', error);
    return NextResponse.json(
      { error: 'Failed to rate item' },
      { status: 500 }
    );
  }
}

