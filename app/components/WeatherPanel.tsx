'use client';

import { SunIcon, CloudIcon } from '@heroicons/react/24/outline';

const FORECAST = [
  { day: 'Wed', hi: '--', lo: '--' },
  { day: 'Thu', hi: '--', lo: '--' },
  { day: 'Fri', hi: '--', lo: '--' },
];

export default function WeatherPanel() {
  return (
    <div className="pane weather-pane flex flex-col border-r border-b border-[var(--line)] bg-[var(--bg-sunk)] p-4.5 [grid-area:weather] max-[860px]:border-0 max-[860px]:p-3.5">
      <h2 className="mb-3 text-[19px] font-semibold tracking-tight max-[860px]:text-xl">Weather</h2>

      <div className="mb-3.5 flex flex-col items-start gap-0.5 border-b border-[var(--line)] pb-3.5">
        <SunIcon className="h-[30px] w-[30px] text-[var(--ink-3)] stroke-[1.4]" />
        <div className="text-[32px] font-bold leading-[1.1] tracking-tight">--°</div>
        <div className="mt-0.5 text-sm text-[var(--ink-3)]">Coming soon</div>
      </div>

      <div className="flex flex-col gap-2">
        {FORECAST.map((f) => (
          <div key={f.day} className="flex items-center gap-2 text-[13px]">
            <span className="w-8 font-semibold text-[var(--ink-3)]">{f.day}</span>
            <CloudIcon className="h-4 w-4 text-[var(--ink-3)] stroke-[1.5]" />
            <span className="ml-auto font-semibold">{f.hi}°</span>
            <span className="text-xs text-[var(--ink-3)]">{f.lo}°</span>
          </div>
        ))}
      </div>

      <div className="mono mt-3.5 border-t border-[var(--line)] pt-3 text-xs text-[var(--ink-3)]">
        sunrise --:-- / sunset --:--
      </div>
    </div>
  );
}
