import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, name, code FROM regions ORDER BY CASE WHEN code = \'ALL\' THEN 0 ELSE 1 END, name'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching regions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? { error: errorMessage, stack: error instanceof Error ? error.stack : undefined }
      : { error: 'Failed to fetch regions' };
    
    return NextResponse.json(
      errorDetails,
      { status: 500 }
    );
  }
}

