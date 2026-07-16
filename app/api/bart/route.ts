import { NextResponse } from 'next/server';
import { fetchBartDepartures, type BartDeparturesResponse } from '@/app/lib/bart';
import { readConfig } from '@/app/lib/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cfg = await readConfig();
  if (!cfg.transitStation) {
    return NextResponse.json<BartDeparturesResponse>({ configured: false });
  }

  try {
    const data = await fetchBartDepartures(cfg.transitStation, cfg.transitLines);
    return NextResponse.json<BartDeparturesResponse>({ configured: true, ...data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch BART departures' }, { status: 502 });
  }
}
