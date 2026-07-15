'use client';

import { useMemo } from 'react';
import { addDays, isSameDay, weekdayShort, fmtMonthDay, fmtTime, fmtTimeRange } from '@/app/lib/dateHelpers';
import { colorsForHue, DEFAULT_EVENT_HUE, DEFAULT_SPAN_HUE } from '@/app/lib/colors';
import type { ParsedEvent } from '@/app/lib/types';

const DAYS = 60;

type Props = { events: ParsedEvent[]; today: Date; dark: boolean };

const isSpan = (e: ParsedEvent) =>
  e.allDay || (e.end !== null && e.end.getTime() - e.start.getTime() >= 86400000);

function activeOnDay(e: ParsedEvent, day: Date) {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = addDays(dayStart, 1);
  const end = e.end ?? e.start;
  return end > dayStart && e.start < dayEnd;
}

export default function ScheduleView({ events, today, dark }: Props) {
  const days = useMemo(() =>
    Array.from({ length: DAYS }, (_, i) => addDays(today, i)), [today]);

  const dayGroups = useMemo(() => {
    const spans = events.filter(isSpan);
    const timed = events.filter((e) => !isSpan(e));

    return days
      .map((day) => {
        const daySpans = spans.filter((e) => activeOnDay(e, day));
        const dayTimed = timed
          .filter((e) => isSameDay(e.start, day))
          .sort((a, b) => a.start.getTime() - b.start.getTime());
        return { day, items: [...daySpans, ...dayTimed] };
      })
      .filter((g) => g.items.length > 0);
  }, [days, events]);

  if (dayGroups.length === 0) {
    return (
      <div className="sched-wrap">
        <div className="empty-state">
          <p>No upcoming events</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sched-wrap">
      {dayGroups.map(({ day, items }) => {
        const today_ = isSameDay(day, today);

        return (
          <div key={day.toDateString()} className="sched-day">
            <div className={`sched-day-hd${today_ ? ' today' : ''}`}>
              <span className="date mono">{fmtMonthDay(day).toUpperCase()}</span>
              <span className="sep">|</span>
              <span className="dow">{weekdayShort(day).toUpperCase()}</span>
            </div>
            <div className="sched-list">
              {items.map((e) => {
                const span = isSpan(e);
                const c = colorsForHue(e.hue ?? (span ? DEFAULT_SPAN_HUE : DEFAULT_EVENT_HUE), dark);
                const timeLabel = span
                  ? 'All day'
                  : e.end
                    ? fmtTimeRange(e.start, e.end)
                    : fmtTime(e.start);
                return (
                  <div key={e.id} className="sched-evt" style={{ '--dot': c.dot } as React.CSSProperties}>
                    <span className="time mono">{timeLabel}</span>
                    <span className="ttl">{e.summary}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
