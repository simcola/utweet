import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = parseInt(params.id);
    const body = await request.json();
    const { title, description, url, category_id, region_id, country_id, is_global, image_url, us_states } = body;

    const result = await pool.query(
      `UPDATE items 
       SET title = $1, description = $2, url = $3, category_id = $4, 
           region_id = $5, country_id = $6, is_global = $7, image_url = $8, updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [title, description || null, url || null, category_id, region_id || null, country_id || null, is_global || false, image_url || null, itemId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    await pool.query('DELETE FROM item_us_states WHERE item_id = $1', [itemId]);
    const stateCodes = Array.isArray(us_states) ? us_states.filter((c: unknown) => typeof c === 'string' && c.length === 2) : [];
    if (stateCodes.length > 0) {
      await pool.query(
        `INSERT INTO item_us_states (item_id, state_code) SELECT $1, unnest($2::text[])`,
        [itemId, stateCodes]
      );
    }

    const fullRow = await pool.query(
      `SELECT i.*, (SELECT COALESCE(array_agg(state_code ORDER BY state_code), ARRAY[]::text[]) FROM item_us_states WHERE item_id = i.id) as us_states
       FROM items i WHERE i.id = $1`,
      [itemId]
    );
    const row = fullRow.rows[0];
    const item = {
      ...result.rows[0],
      us_states: Array.isArray(row?.us_states) ? row.us_states : [],
    };
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
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

    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [itemId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    );
  }
}

