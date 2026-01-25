import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query(
      'SELECT id, name, slug, parent_id, display_order, COALESCE(column_span, 1) as column_span FROM categories ORDER BY display_order, name'
    );
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? { error: errorMessage, stack: error instanceof Error ? error.stack : undefined }
      : { error: 'Failed to fetch categories' };
    
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

