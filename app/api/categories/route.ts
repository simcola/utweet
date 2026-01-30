import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // First check if column_span exists
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'categories' AND column_name = 'column_span'
    `);
    
    const hasColumnSpan = columnCheck.rows.length > 0;
    
    // Use different query based on whether column_span exists
    let query: string;
    if (hasColumnSpan) {
      query = 'SELECT id, name, slug, parent_id, display_order, COALESCE(column_span, 1) as column_span FROM categories ORDER BY display_order, name';
    } else {
      query = 'SELECT id, name, slug, parent_id, display_order, 1 as column_span FROM categories ORDER BY display_order, name';
    }
    
    const result = await pool.query(query);
    
    // Ensure all rows have column_span
    const rows = result.rows.map(row => ({
      ...row,
      column_span: row.column_span || 1
    }));
    
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error instanceof Error && 'code' in error ? (error as any).code : undefined;
    
    // Return more details even in production for debugging
    const errorDetails = {
      error: 'Failed to fetch categories',
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, parent_id, display_order, column_span } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO categories (name, slug, parent_id, display_order, column_span)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, slug, parent_id, display_order, COALESCE(column_span, 1) as column_span`,
      [
        name,
        slug,
        parent_id || null,
        display_order || 0,
        column_span || 1,
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

