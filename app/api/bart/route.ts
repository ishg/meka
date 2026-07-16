import { NextResponse } from 'next/server';
import { fetchBartDepartures } from '@/app/lib/bart';
import { readConfig } from '@/app/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cfg = await readConfig();
    const data = await fetchBartDepartures(cfg.transitLines);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch BART departures' }, { status: 502 });
  }
}
