// BART real-time estimates (ETD) API — https://api.bart.gov/docs/etd/etd.aspx
// Uses BART's public demo key by default; set BART_API_KEY to use your own.

export type Direction = 'North' | 'South';

export type BartDeparture = {
  destination: string;
  minutes: number; // 0 when the train is "Leaving"
  label: string;   // "Leaving" or the raw minute count as a string
  line: string;     // BART's line color name, e.g. "ORANGE"
  hexColor: string;
};

export type BartDepartures = {
  stationName: string;
  updatedAt: string;
  north: BartDeparture[];
  south: BartDeparture[];
};

// A distinct (line color, destination) pairing a user can pick in Settings.
export type BartLineOption = {
  id: string;
  destination: string;
  direction: Direction;
  line: string;
  hexColor: string;
};

const STATION = '12TH'; // 12th St. Oakland City Center
const DEMO_KEY = 'MW9S-E7SL-26DU-VV8V'; // BART's public demo key
const MAX_PER_DIRECTION = 6;

type RawEstimate = {
  minutes?: string;
  direction?: string;
  color?: string;
  hexcolor?: string;
};

type RawEtd = {
  destination?: string;
  estimate?: RawEstimate[];
};

export function bartLineId(line: string, destination: string): string {
  return `${line}|${destination}`;
}

async function fetchRawEtd(): Promise<{ stationName: string; etds: RawEtd[] }> {
  const key = process.env.BART_API_KEY || DEMO_KEY;
  const url = `https://api.bart.gov/api/etd.aspx?cmd=etd&orig=${STATION}&key=${key}&json=y`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`BART API responded ${res.status}`);
  const data = await res.json();

  const station = data?.root?.station?.[0];
  return {
    stationName: String(station?.name ?? '12th St. Oakland City Center'),
    etds: Array.isArray(station?.etd) ? station.etd : [],
  };
}

// Every (line, destination) pairing currently being served, for the Settings picker.
export async function fetchBartLineOptions(): Promise<BartLineOption[]> {
  const { etds } = await fetchRawEtd();
  const seen = new Map<string, BartLineOption>();

  for (const etd of etds) {
    const destination = String(etd.destination ?? '');
    for (const est of etd.estimate ?? []) {
      const line = String(est.color ?? '').toUpperCase();
      const id = bartLineId(line, destination);
      if (seen.has(id)) continue;
      seen.set(id, {
        id,
        destination,
        direction: est.direction === 'South' ? 'South' : 'North',
        line,
        hexColor: String(est.hexcolor ?? '#888888'),
      });
    }
  }

  return [...seen.values()].sort((a, b) =>
    a.direction === b.direction
      ? a.destination.localeCompare(b.destination)
      : a.direction === 'North' ? -1 : 1
  );
}

// selectedLineIds is a set of bartLineId() values from Settings; empty/undefined shows everything.
export async function fetchBartDepartures(selectedLineIds?: string[]): Promise<BartDepartures> {
  const { stationName, etds } = await fetchRawEtd();
  const filter = selectedLineIds && selectedLineIds.length > 0 ? new Set(selectedLineIds) : null;

  const north: BartDeparture[] = [];
  const south: BartDeparture[] = [];

  for (const etd of etds) {
    const destination = String(etd.destination ?? '');
    for (const est of etd.estimate ?? []) {
      const line = String(est.color ?? '').toUpperCase();
      if (filter && !filter.has(bartLineId(line, destination))) continue;

      const raw = String(est.minutes ?? '');
      const leaving = raw.toLowerCase() === 'leaving';
      const dep: BartDeparture = {
        destination,
        minutes: leaving ? 0 : Number(raw) || 0,
        label: leaving ? 'Leaving' : raw,
        line,
        hexColor: String(est.hexcolor ?? '#888888'),
      };
      (est.direction === 'South' ? south : north).push(dep);
    }
  }

  north.sort((a, b) => a.minutes - b.minutes);
  south.sort((a, b) => a.minutes - b.minutes);

  return {
    stationName,
    updatedAt: new Date().toISOString(),
    north: north.slice(0, MAX_PER_DIRECTION),
    south: south.slice(0, MAX_PER_DIRECTION),
  };
}
