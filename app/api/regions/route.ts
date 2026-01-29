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
    const errorCode = error instanceof Error && 'code' in error ? (error as any).code : undefined;
    
    // Return more details even in production for debugging
    const errorDetails = {
      error: 'Failed to fetch regions',
      message: errorMessage,
      code: errorCode,
      hint: errorCode === 'ECONNREFUSED' 
        ? 'Database connection refused. Check DATABASE_URL and RDS security group.'
        : errorCode === '28P01' 
        ? 'Authentication failed. Check DATABASE_URL username and password.'
        : errorCode === '3D000'
        ? 'Database does not exist. Check DATABASE_URL database name.'
        : 'Check CloudWatch logs for more details.'
    };
    
    return NextResponse.json(
      errorDetails,
      { status: 500 }
    );
  }
}

