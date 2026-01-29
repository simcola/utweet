import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Item } from '@/lib/types';

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT 
        i.*,
        json_build_object('id', r.id, 'name', r.name, 'code', r.code) as region,
        json_build_object('id', co.id, 'name', co.name, 'code', co.code) as country,
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) as category,
        COALESCE(AVG(rt.rating), 0) as average_rating,
        COUNT(DISTINCT rt.id) as rating_count,
        COUNT(DISTINCT l.id) as like_count
      FROM items i
      LEFT JOIN regions r ON i.region_id = r.id
      LEFT JOIN countries co ON i.country_id = co.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN ratings rt ON i.id = rt.item_id
      LEFT JOIN likes l ON i.id = l.item_id
      GROUP BY i.id, r.id, r.name, r.code, co.id, co.name, co.code, c.id, c.name, c.slug
      ORDER BY i.created_at DESC
    `);

    const items: Item[] = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      url: row.url,
      category_id: row.category_id,
      region_id: row.region_id,
      country_id: row.country_id,
      is_global: row.is_global,
      image_url: row.image_url,
      created_at: row.created_at,
      updated_at: row.updated_at,
      region: row.region && row.region.id ? row.region : null,
      country: row.country && row.country.id ? row.country : null,
      category: row.category,
      average_rating: parseFloat(row.average_rating) || 0,
      rating_count: parseInt(row.rating_count) || 0,
      like_count: parseInt(row.like_count) || 0,
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = error instanceof Error && 'code' in error ? (error as any).code : undefined;
    
    // Return more details even in production for debugging
    const errorDetails = {
      error: 'Failed to fetch items',
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
    const { title, description, url, category_id, region_id, country_id, is_global, image_url } = body;

    const result = await pool.query(
      `INSERT INTO items (title, description, url, category_id, region_id, country_id, is_global, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, description || null, url || null, category_id, region_id || null, country_id || null, is_global || false, image_url || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating item:', error);
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    );
  }
}

