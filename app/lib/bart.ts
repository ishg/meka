// BART real-time estimates (ETD) API — https://api.bart.gov/docs/etd/etd.aspx
// Uses BART's public demo key by default; set BART_API_KEY to use your own.

import { SEQ, ST, type MetroLine } from '@/app/lib/metroData';

export type Direction = 'North' | 'South';

export type BartStation = {
  abbr: string;
  name: string;
};

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

// What /api/bart returns: either a real departures payload, or a marker that
// no station has been picked in Settings yet.
export type BartDeparturesResponse =
  | ({ configured: true } & BartDepartures)
  | { configured: false };

// A distinct (line color, destination) pairing a user can pick in Settings.
export type BartLineOption = {
  id: string;
  destination: string;
  direction: Direction;
  line: string;
  hexColor: string;
};

const DEMO_KEY = 'MW9S-E7SL-26DU-VV8V'; // BART's public demo key
const MAX_PER_DIRECTION = 6;

function apiKey(): string {
  return process.env.BART_API_KEY || DEMO_KEY;
}

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

type RawStation = { abbr?: string; name?: string };

export function bartLineId(line: string, destination: string): string {
  return `${line}|${destination}`;
}

// Every BART station, for the Settings picker.
export async function fetchBartStations(): Promise<BartStation[]> {
  const url = `https://api.bart.gov/api/stn.aspx?cmd=stns&key=${apiKey()}&json=y`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`BART API responded ${res.status}`);
  const data = await res.json();

  const stations = data?.root?.stations?.station;
  const list: RawStation[] = Array.isArray(stations) ? stations : [];
  return list
    .map((s) => ({ abbr: String(s.abbr ?? ''), name: String(s.name ?? '') }))
    .filter((s) => s.abbr)
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function fetchRawEtd(station: string): Promise<{ stationName: string; etds: RawEtd[] }> {
  const url = `https://api.bart.gov/api/etd.aspx?cmd=etd&orig=${station}&key=${apiKey()}&json=y`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`BART API responded ${res.status}`);
  const data = await res.json();

  const stn = data?.root?.station?.[0];
  return {
    stationName: String(stn?.name ?? station),
    etds: Array.isArray(stn?.etd) ? stn.etd : [],
  };
}

// Every (line, destination) pairing currently being served, for the Settings picker.
export async function fetchBartLineOptions(station: string): Promise<BartLineOption[]> {
  const { etds } = await fetchRawEtd(station);
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
export async function fetchBartDepartures(station: string, selectedLineIds?: string[]): Promise<BartDepartures> {
  const { stationName, etds } = await fetchRawEtd(station);
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

// A train between two adjacent stops on a MetroLine, derived from the ETD feed.
// BART has no vehicle positions, so a train that is `m` minutes from station S
// (closer than one segment's travel time) is placed on the segment prev → S.
export type BartTrain = {
  line: MetroLine;
  from: string;
  to: string;
  arrive: number; // epoch ms the train reaches `to`
  seg: number;    // ms it takes to travel from → to
};

export async function fetchBartTrains(): Promise<BartTrain[]> {
  const url = `https://api.bart.gov/api/etd.aspx?cmd=etd&orig=ALL&key=${apiKey()}&json=y`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`BART API responded ${res.status}`);
  const data = await res.json();
  const stations: { abbr?: string; etd?: (RawEtd & { abbreviation?: string })[] }[] =
    Array.isArray(data?.root?.station) ? data.root.station : [];

  const now = Date.now();
  const found: (BartTrain & { pos: number; m: number; group: string })[] = [];

  for (const stn of stations) {
    const to = String(stn.abbr ?? '');
    for (const etd of stn.etd ?? []) {
      const dest = String(etd.abbreviation ?? '');
      for (const est of etd.estimate ?? []) {
        const color = String(est.color ?? '').toUpperCase();
        const line = (color === 'GREY' ? 'OAK' : color) as MetroLine;
        const seq = SEQ[line];
        const i = seq?.indexOf(to) ?? -1;
        const d = seq?.indexOf(dest) ?? -1;
        if (i < 0 || d < 0 || d === i) continue;
        const from = seq[i + (d > i ? -1 : 1)];
        if (!from) continue; // train is leaving its origin terminus

        const raw = String(est.minutes ?? '');
        const m = raw.toLowerCase() === 'leaving' ? 0 : Number(raw);
        const [fx, fy] = ST[from];
        const [tx, ty] = ST[to];
        const segMin = Math.min(6, Math.max(1.5, Math.hypot(tx - fx, ty - fy) * 0.7));
        if (!Number.isFinite(m) || m >= segMin) continue;
        // pos: fractional index along the line; group: one line + travel direction.
        const sign = d > i ? 1 : -1;
        found.push({
          line, from, to, m, arrive: now + m * 60000, seg: segMin * 60000,
          pos: i - sign * (m / segMin), group: `${line}${sign}`,
        });
      }
    }
  }

  // The same physical train shows up in neighbouring stations' estimates (and
  // as "Leaving"); keep only the nearest-in-time one within ~1/3 of a station.
  found.sort((a, b) => a.m - b.m);
  const kept: typeof found = [];
  for (const t of found) {
    if (!kept.some((k) => k.group === t.group && Math.abs(k.pos - t.pos) < 0.35)) kept.push(t);
  }
  return kept.map(({ line, from, to, arrive, seg }) => ({ line, from, to, arrive, seg }));
}
