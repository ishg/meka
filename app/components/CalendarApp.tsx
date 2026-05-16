'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Squares2X2Icon,
  QueueListIcon,
  SunIcon,
  MoonIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import TwoWeekView from './TwoWeekView';
import ScrollView from './ScrollView';
import CelebrationsPanel from './CelebrationsPanel';
import type { EventData, ParsedEvent } from '@/app/lib/types';
import { weekdayLong, monthName } from '@/app/lib/dateHelpers';

type View = 'grid' | 'scroll';

type Props = {
  events: EventData[];
  celebrations: EventData[];
  todayMs: number;
};

export default function CalendarApp({ events, celebrations, todayMs }: Props) {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState<View>('grid');

  const today = useMemo(() => new Date(todayMs), [todayMs]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  const parsedEvents = useMemo((): ParsedEvent[] =>
    events.map((e) => ({
      ...e,
      start: new Date(e.start),
      end: e.end !== null ? new Date(e.end) : null,
    })),
    [events]
  );

  const parsedCelebrations = useMemo((): ParsedEvent[] =>
    celebrations.map((e) => ({
      ...e,
      start: new Date(e.start),
      end: e.end !== null ? new Date(e.end) : null,
    })),
    [celebrations]
  );

  const weekday = weekdayLong(today);
  const dateRest = `${monthName(today)} ${today.getDate()}, ${today.getFullYear()}`;

  return (
    <div className="app">
      <div className="pane cal-pane">
        <div className="hd">
          <div className="hd-l">
            <h1>
              {weekday}, <span className="hd-date">{dateRest}</span>
            </h1>
          </div>
          <div className="hd-r">
            <div className="seg">
              <button data-active={view === 'grid' ? 'true' : 'false'} onClick={() => setView('grid')}>
                <Squares2X2Icon className="ico" /> 2 weeks
              </button>
              <button data-active={view === 'scroll' ? 'true' : 'false'} onClick={() => setView('scroll')}>
                <QueueListIcon className="ico" /> Timeline
              </button>
            </div>
            <button className="icon-btn" onClick={() => setDark((d) => !d)} title="Toggle theme">
              {dark ? <SunIcon className="ico" /> : <MoonIcon className="ico" />}
            </button>
            <Link href="/admin" className="admin-link" title="Settings">
              <Cog6ToothIcon className="ico" />
            </Link>
          </div>
        </div>

        {view === 'grid'
          ? <TwoWeekView events={parsedEvents} today={today} dark={dark} />
          : <ScrollView  events={parsedEvents} today={today} dark={dark} />}
      </div>

      <CelebrationsPanel events={parsedCelebrations} today={today} />
    </div>
  );
}
