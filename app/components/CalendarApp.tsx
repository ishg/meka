'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Squares2X2Icon,
  QueueListIcon,
  ListBulletIcon,
  CalendarDaysIcon,
  GiftIcon,
  CloudIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import TwoWeekView from './TwoWeekView';
import ScrollView from './ScrollView';
import ScheduleView from './ScheduleView';
import CelebrationsPanel from './CelebrationsPanel';
import WeatherPanel from './WeatherPanel';
import TransitPanel from './TransitPanel';
import TopBar from './TopBar';
import type { EventData, ParsedEvent } from '@/app/lib/types';
import { readStoredTheme, applyTheme } from '@/app/lib/theme';

type View = 'grid' | 'scroll' | 'agenda';
type MobileTab = 'cal' | 'celebs' | 'weather' | 'transit';

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

  return (
    <div className="app" data-mobile-tab={mobileTab}>
      <TopBar />
      <WeatherPanel />
      <TransitPanel />

      <div className="pane cal-pane">
        <div className="hd">
          <div className="seg seg-compact">
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
        <button className="tab" data-active={mobileTab === 'weather' ? 'true' : 'false'} onClick={() => setMobileTab('weather')} aria-label="Weather">
          <CloudIcon className="ico" />
        </button>
        <button className="tab" data-active={mobileTab === 'transit' ? 'true' : 'false'} onClick={() => setMobileTab('transit')} aria-label="Transit">
          <TruckIcon className="ico" />
        </button>
      </div>
    </div>
  );
}
