import { NextResponse } from 'next/server';
import { US_STATES } from '@/lib/us-states';

export async function GET() {
  return NextResponse.json(US_STATES);
}
