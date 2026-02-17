import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';

// GET - Serve image by photo id (keeps list API response small to avoid 413)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = parseInt(params.id);
    if (isNaN(photoId)) {
      return NextResponse.json({ error: 'Invalid photo id' }, { status: 400 });
    }

    const result = await pool.query(
      'SELECT image_url FROM photos WHERE id = $1',
      [photoId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const imageUrl = result.rows[0].image_url as string;

    if (imageUrl.startsWith('data:')) {
      const match = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        return NextResponse.json({ error: 'Invalid image data' }, { status: 500 });
      }
      const contentType = match[1];
      const base64 = match[2];
      const buffer = Buffer.from(base64, 'base64');
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    if (imageUrl.startsWith('/')) {
      const filepath = join(process.cwd(), 'public', imageUrl);
      try {
        const buffer = await readFile(filepath);
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      } catch {
        return NextResponse.json({ error: 'Image file not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Invalid image_url' }, { status: 500 });
  } catch (error) {
    console.error('Error serving photo image:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
}
