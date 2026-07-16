'use client';

import { useEffect, useState } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import type { BartDepartures, BartDeparturesResponse } from '@/app/lib/bart';

const POLL_MS = 60000;
const VISIBLE_ROWS = 3;
const CYCLE_MS = 5000;
const TRANSITION_MS = 450;
const ROW_H = 36; // px — must match the pill's h-9
const ROW_GAP = 6; // px — must match gap-1.5
const ROW_STEP = ROW_H + ROW_GAP;

// Short display names for destinations that don't fit well in a narrow pill.
const DEST_ABBREV: Record<string, string> = {
  'Pittsburg/Bay Point': 'Pts/Bay Pt',
};

function displayDestination(name: string): string {
  return DEST_ABBREV[name] ?? name;
}

function DeparturePill({ d }: { d: BartDepartures['north'][number] }) {
  return (
    <span
      className="flex h-9 w-full shrink-0 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--bg-elev)] px-3 text-[13px] text-[var(--ink-3)]"
      title={d.destination}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: d.hexColor }} />
      <span className="flex-1 truncate">{displayDestination(d.destination)}</span>
      <span className="mono shrink-0 text-[16px] font-bold text-[var(--ink)]">
        {d.label === 'Leaving' ? 'Now' : `${d.label}m`}
      </span>
    </span>
  );
}

function DepartureRow({ label, icon, departures }: {
  label: string;
  icon: React.ReactNode;
  departures: BartDepartures['north'];
}) {
  const total = departures.length;
  const pageCount = Math.max(1, Math.ceil(total / VISIBLE_ROWS));
  const looping = pageCount > 1;

  const [page, setPage] = useState(0);
  const [trackedDepartures, setTrackedDepartures] = useState(departures);

  if (departures !== trackedDepartures) {
    setTrackedDepartures(departures);
    setPage(0);
  }

  useEffect(() => {
    if (!looping) return;
    const id = setInterval(() => setPage((p) => (p + 1) % pageCount), CYCLE_MS);
    return () => clearInterval(id);
  }, [looping, pageCount]);

  if (total === 0) {
    return (
      <div>
        <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-2)]">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-[13px] text-[var(--ink-3)]">No trains scheduled</span>
      </div>
    );
  }

  if (!looping) {
    return (
      <div>
        <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-2)]">
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {departures.map((d, i) => <DeparturePill key={i} d={d} />)}
        </div>
      </div>
    );
  }

  // Always slide to a full VISIBLE_ROWS-row window; the last page overlaps
  // backward instead of running off the end of the list.
  const pageStart = Math.min(page * VISIBLE_ROWS, total - VISIBLE_ROWS);

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-2)]">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className="overflow-hidden"
        style={{ height: VISIBLE_ROWS * ROW_H + (VISIBLE_ROWS - 1) * ROW_GAP }}
      >
        <div
          className="flex flex-col gap-1.5"
          style={{
            transform: `translateY(-${pageStart * ROW_STEP}px)`,
            transition: `transform ${TRANSITION_MS}ms ease`,
          }}
        >
          {departures.map((d, i) => <DeparturePill key={i} d={d} />)}
        </div>
      </div>
    </div>
  );
}

export default function TransitPanel() {
  const [data, setData] = useState<BartDeparturesResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/bart');
        if (!res.ok) throw new Error('bad response');
        const json = (await res.json()) as BartDeparturesResponse;
        if (!cancelled) {
          setData(json);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    load();
    const id = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const departures = data?.configured ? data : null;

  return (
    <div className="pane transit-pane flex flex-1 min-h-0 flex-col border-r border-[var(--line)] bg-[var(--bg-sunk)] p-4.5 max-[860px]:border-0 max-[860px]:p-3.5">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-[19px] font-semibold tracking-tight max-[860px]:text-xl">BART</h2>
        {departures && (
          <span className="truncate text-xs text-[var(--ink-3)]">{departures.stationName}</span>
        )}
      </div>

      {data && !data.configured ? (
        <p className="text-xs text-[var(--ink-3)]">Pick a station in Settings →</p>
      ) : (
        <>
          <div className="flex flex-col gap-3.5">
            <DepartureRow
              label="Southbound"
              icon={<ArrowDownIcon className="h-[15px] w-[15px] text-[var(--ink-3)]" />}
              departures={departures?.south ?? []}
            />
            <DepartureRow
              label="Northbound"
              icon={<ArrowUpIcon className="h-[15px] w-[15px] text-[var(--ink-3)]" />}
              departures={departures?.north ?? []}
            />
          </div>

          {error && !departures && (
            <p className="mt-3.5 text-xs text-[var(--ink-3)]">Unable to load departures</p>
          )}
        </>
      )}
    </div>
  );
}
