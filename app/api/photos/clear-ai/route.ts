import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * POST /api/photos/clear-ai
 * Clears all stored AiID (Gemini) data so identification can be run again on all photos.
 */
export async function POST() {
  try {
    const result = await pool.query(
      `UPDATE photos SET airesponse = NULL, species = NULL WHERE airesponse IS NOT NULL OR species IS NOT NULL RETURNING id`
    );
    const count = result.rowCount ?? 0;
    return NextResponse.json({
      ok: true,
      cleared: count,
      message: `Cleared AI data for ${count} photo(s). You can run AiID again on any photo.`,
    });
  } catch (error) {
    console.error('Error clearing AI data:', error);
    return NextResponse.json(
      { error: 'Failed to clear AI data' },
      { status: 500 }
    );
  }
}
