'use client';

import {
  SunIcon,
  CloudIcon,
  CloudArrowDownIcon,
  BoltIcon,
  MoonIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import type { WeatherData } from '@/app/lib/weather';
import { weatherLabel } from '@/app/lib/weather';

type Props = {
  weather: WeatherData | null;
  weatherZip: string;
};

function WeatherIcon({ code, isDay, className }: { code: number; isDay: boolean; className: string }) {
  if (code === 0 || code === 1) {
    return isDay ? <SunIcon className={className} /> : <MoonIcon className={className} />;
  }
  if (code === 2 || code === 3 || code === 45 || code === 48) return <CloudIcon className={className} />;
  if (code >= 95) return <BoltIcon className={className} />;
  if (code >= 51) return <CloudArrowDownIcon className={className} />;
  return <CloudIcon className={className} />;
}

export default function WeatherPanel({ weather, weatherZip }: Props) {
  return (
    <div className="pane weather-pane flex flex-col border-r border-b border-[var(--line)] bg-[var(--bg-sunk)] p-4.5 max-[860px]:border-0 max-[860px]:p-3.5">
      {weather && (
        <div className="mb-2 truncate text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--ink-3)]">
          {weather.placeName}
        </div>
      )}

      {!weatherZip ? (
        <p className="text-xs text-[var(--ink-3)]">Pick a zip code in Settings →</p>
      ) : !weather ? (
        <p className="text-xs text-[var(--ink-3)]">Unable to load weather</p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="text-[36px] font-bold leading-none tracking-tight">{weather.currentTemp}°</div>
            <div className="flex flex-col items-center gap-1">
              <WeatherIcon
                code={weather.currentCode}
                isDay={weather.isDay}
                className="h-7 w-7 text-[var(--ink-3)] stroke-[1.3]"
              />
              <span className="text-[11px] text-[var(--ink-3)]">{weatherLabel(weather.currentCode)}</span>
            </div>
          </div>

          <div className="mono mb-3.5 mt-2 flex justify-between border-b border-[var(--line)] pb-3.5 text-xs text-[var(--ink-3)]">
            <span className="flex items-center gap-1">
              <ArrowUpIcon className="h-3 w-3" /> {weather.sunrise}
            </span>
            <span className="flex items-center gap-1">
              <ArrowDownIcon className="h-3 w-3" /> {weather.sunset}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {weather.forecast.map((f) => (
              <div key={f.day} className="flex flex-col items-center gap-1">
                <span className="text-[9px] font-semibold text-[var(--ink-3)]">{f.day.slice(0, 2)}</span>
                <WeatherIcon code={f.code} isDay className="h-3.5 w-3.5 text-[var(--ink-3)] stroke-[1.5]" />
                <span className="text-[11px] font-semibold leading-none">{f.hi}°</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
