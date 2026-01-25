import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionCode = searchParams.get('region');

    const values: any[] = [];
    let whereClause = '';

    if (regionCode && regionCode !== 'ALL') {
      whereClause = 'WHERE r.code = $1';
      values.push(regionCode);
    }

    const result = await pool.query(
      `SELECT c.id, c.name, c.code, r.id AS region_id, r.name AS region_name, r.code AS region_code
       FROM countries c
       JOIN regions r ON c.region_id = r.id
       ${whereClause}
       ORDER BY c.name`,
      values
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching countries:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = process.env.NODE_ENV === 'development'
      ? { error: errorMessage, stack: error instanceof Error ? error.stack : undefined }
      : { error: 'Failed to fetch countries' };

    return NextResponse.json(errorDetails, { status: 500 });
  }
}


