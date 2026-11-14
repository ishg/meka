import { NextResponse } from 'next/server';
import { fetchBartTrains } from '@/app/lib/bart';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ trains: await fetchBartTrains() });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch BART trains' }, { status: 502 });
  }
}
