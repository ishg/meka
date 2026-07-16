'use client';

import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

const DEPARTURES = {
  inbound: ['--', '--', '--'],
  outbound: ['--', '--', '--'],
};

export default function TransitPanel() {
  return (
    <div className="pane transit-pane flex flex-col border-r border-[var(--line)] bg-[var(--bg-sunk)] p-4.5 [grid-area:transit] max-[860px]:border-0 max-[860px]:p-3.5">
      <h2 className="mb-3 text-[19px] font-semibold tracking-tight max-[860px]:text-xl">BART</h2>

      <div className="flex flex-col gap-3.5">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-2)]">
            <ArrowUpIcon className="h-[15px] w-[15px] text-[var(--ink-3)]" />
            <span>Inbound</span>
          </div>
          <div className="mono flex flex-wrap gap-2">
            {DEPARTURES.inbound.map((t, i) => (
              <span
                key={i}
                className="rounded-full border border-[var(--line)] bg-[var(--bg-elev)] px-2.5 py-1 text-[13px] text-[var(--ink-3)]"
              >
                {t} min
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-2)]">
            <ArrowDownIcon className="h-[15px] w-[15px] text-[var(--ink-3)]" />
            <span>Outbound</span>
          </div>
          <div className="mono flex flex-wrap gap-2">
            {DEPARTURES.outbound.map((t, i) => (
              <span
                key={i}
                className="rounded-full border border-[var(--line)] bg-[var(--bg-elev)] px-2.5 py-1 text-[13px] text-[var(--ink-3)]"
              >
                {t} min
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3.5 text-xs text-[var(--ink-3)]">Live departures coming soon</p>
    </div>
  );
}
