'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Squares2X2Icon,
  QueueListIcon,
  ListBulletIcon,
  Cog6ToothIcon,
  CalendarDaysIcon,
  GiftIcon,
} from '@heroicons/react/24/outline';
import TwoWeekView from './TwoWeekView';
import ScrollView from './ScrollView';
import ScheduleView from './ScheduleView';
import CelebrationsPanel from './CelebrationsPanel';
import type { EventData, ParsedEvent } from '@/app/lib/types';
import { weekdayLong, monthName } from '@/app/lib/dateHelpers';
import { readStoredTheme, applyTheme } from '@/app/lib/theme';

type View = 'grid' | 'scroll' | 'agenda';
type MobileTab = 'cal' | 'celebs';

type Props = {
  events: EventData[];
  celebrations: EventData[];
  todayMs: number;
};

export default function CalendarApp({ events, celebrations, todayMs }: Props) {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState<View>('grid');
  const [mobileTab, setMobileTab] = useState<MobileTab>('cal');

  const today = useMemo(() => new Date(todayMs), [todayMs]);

  useEffect(() => {
    const syncTheme = () => {
      const theme = readStoredTheme();
      setDark(theme === 'dark');
      applyTheme(theme);
    };
    syncTheme();
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

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
    <div className="app" data-mobile-tab={mobileTab}>
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
                <Squares2X2Icon className="ico" /> <span className="seg-label">2 weeks</span>
              </button>
              <button data-active={view === 'scroll' ? 'true' : 'false'} onClick={() => setView('scroll')}>
                <QueueListIcon className="ico" /> <span className="seg-label">Timeline</span>
              </button>
              <button data-active={view === 'agenda' ? 'true' : 'false'} onClick={() => setView('agenda')}>
                <ListBulletIcon className="ico" /> <span className="seg-label">Agenda</span>
              </button>
            </div>
            <Link href="/admin" className="admin-link" title="Settings">
              <Cog6ToothIcon className="ico" />
            </Link>
          </div>
        </div>

        {view === 'grid' && <TwoWeekView events={parsedEvents} today={today} dark={dark} />}
        {view === 'scroll' && <ScrollView events={parsedEvents} today={today} dark={dark} />}
        {view === 'agenda' && <ScheduleView events={parsedEvents} today={today} dark={dark} />}
      </div>

      <CelebrationsPanel events={parsedCelebrations} today={today} />

      <div className="mobile-tabs">
        <button className="tab" data-active={mobileTab === 'cal' ? 'true' : 'false'} onClick={() => setMobileTab('cal')} aria-label="Calendar">
          <CalendarDaysIcon className="ico" />
        </button>
        <button className="tab" data-active={mobileTab === 'celebs' ? 'true' : 'false'} onClick={() => setMobileTab('celebs')} aria-label="Coming up">
          <GiftIcon className="ico" />
        </button>
      </div>
    </div>
  );
}
