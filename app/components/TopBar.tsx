'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cog6ToothIcon, MapIcon } from '@heroicons/react/24/outline';
import { weekdayLong, monthName } from '@/app/lib/dateHelpers';

function fmtClock(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function TopBar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-[var(--line)] bg-[var(--bg-elev)] px-5 py-3.5 [grid-area:topbar] max-[860px]:gap-2 max-[860px]:px-3.5 max-[860px]:py-2.5">
      <span className="text-sm text-[var(--ink-2)] max-[860px]:text-xs">
        {now ? `${weekdayLong(now)}, ${monthName(now)} ${now.getDate()}, ${now.getFullYear()}` : ''}
      </span>
      <span className="mono text-3xl font-bold tracking-tight max-[860px]:text-xl">
        {now ? fmtClock(now) : '--:-- --'}
      </span>
      <div className="flex items-center gap-2 justify-self-end">
        <Link href="/map" className="admin-link" title="BART map screensaver">
          <MapIcon className="ico" />
        </Link>
        <Link href="/admin" className="admin-link" title="Settings">
          <Cog6ToothIcon className="ico" />
        </Link>
      </div>
    </div>
  );
}
