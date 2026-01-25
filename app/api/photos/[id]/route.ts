import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Get a single photo (for admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = parseInt(params.id);
    const result = await pool.query('SELECT * FROM photos WHERE id = $1', [photoId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching photo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photo' },
      { status: 500 }
    );
  }
}

// PUT - Update photo (approve, edit likes, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = parseInt(params.id);
    const body = await request.json();
    const { approved, likes } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (approved !== undefined) {
      updates.push(`approved = $${paramCount++}`);
      values.push(approved);
    }

    if (likes !== undefined) {
      // Get current like count from photo_likes table
      const currentLikesResult = await pool.query(
        'SELECT COUNT(*) as count FROM photo_likes WHERE photo_id = $1',
        [photoId]
      );
      const currentLikes = parseInt(currentLikesResult.rows[0].count) || 0;
      const targetLikes = parseInt(likes);
      const difference = targetLikes - currentLikes;

      if (difference > 0) {
        // Add admin adjustment likes
        for (let i = 0; i < difference; i++) {
          await pool.query(
            `INSERT INTO photo_likes (photo_id, user_ip)
             VALUES ($1, $2)
             ON CONFLICT (photo_id, user_ip) DO NOTHING`,
            [photoId, `admin_adjustment_${photoId}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`]
          );
        }
      } else if (difference < 0) {
        // Remove likes (prioritize admin adjustments, then oldest)
        const toRemove = Math.abs(difference);
        await pool.query(
          `DELETE FROM photo_likes 
           WHERE photo_id = $1 
           AND id IN (
             SELECT id FROM photo_likes 
             WHERE photo_id = $1 
             ORDER BY CASE WHEN user_ip LIKE 'admin_adjustment_%' THEN 0 ELSE 1 END, created_at ASC
             LIMIT $2
           )`,
          [photoId, toRemove]
        );
      }
      
      // Update photos.likes column to keep it in sync (as cache)
      const updatedCountResult = await pool.query(
        'SELECT COUNT(*) as count FROM photo_likes WHERE photo_id = $1',
        [photoId]
      );
      const updatedCount = parseInt(updatedCountResult.rows[0].count) || 0;
      updates.push(`likes = $${paramCount++}`);
      values.push(updatedCount);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(photoId);
    const query = `UPDATE photos SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating photo:', error);
    return NextResponse.json(
      { error: 'Failed to update photo' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = parseInt(params.id);

    // Get photo info before deleting (to delete file)
    const photoResult = await pool.query('SELECT image_url FROM photos WHERE id = $1', [photoId]);

    if (photoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Photo not found' },
        { status: 404 }
      );
    }

    // Delete from database (cascade will delete likes)
    await pool.query('DELETE FROM photos WHERE id = $1', [photoId]);

    // Note: In production, you might want to delete the actual file from the filesystem
    // For now, we'll just delete from the database

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json(
      { error: 'Failed to delete photo' },
      { status: 500 }
    );
  }
}


