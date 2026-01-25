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
    const clientIP = getClientIP(request);

    await pool.query(
      `INSERT INTO likes (item_id, user_ip)
       VALUES ($1, $2)
       ON CONFLICT (item_id, user_ip) DO NOTHING`,
      [itemId, clientIP]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error liking item:', error);
    return NextResponse.json(
      { error: 'Failed to like item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = parseInt(params.id);
    const clientIP = getClientIP(request);

    await pool.query(
      'DELETE FROM likes WHERE item_id = $1 AND user_ip = $2',
      [itemId, clientIP]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unliking item:', error);
    return NextResponse.json(
      { error: 'Failed to unlike item' },
      { status: 500 }
    );
  }
}

