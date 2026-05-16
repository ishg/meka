'use client';

import { useMemo } from 'react';
import { addDays, isSameDay, fmtTime } from '@/app/lib/dateHelpers';
import { layoutSpans, type Span } from '@/app/lib/layoutHelpers';
import { colorsForHue, DEFAULT_EVENT_HUE, DEFAULT_SPAN_HUE } from '@/app/lib/colors';
import type { ParsedEvent } from '@/app/lib/types';

function evtStyle(hue: number | null, dark: boolean) {
  const c = colorsForHue(hue ?? DEFAULT_EVENT_HUE, dark);
  return {
    background: c.fill,
    color:      c.ink,
    '--dot':    c.dot,
  } as React.CSSProperties;
}

function spanStyle(hue: number | null, dark: boolean) {
  const c = colorsForHue(hue ?? DEFAULT_SPAN_HUE, dark);
  return {
    background: c.fill,
    color:      c.ink,
    '--dot':    c.dot,
  } as React.CSSProperties;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

type Props = { events: ParsedEvent[]; today: Date; dark: boolean };

export default function TwoWeekView({ events, today, dark }: Props) {
  const days = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => addDays(today, i)), [today]);

  const spans = useMemo((): Span[] =>
    events
      .filter((e) => e.allDay || (e.end && e.end.getTime() - e.start.getTime() >= 86400000))
      .map((e) => ({ id: e.id, summary: e.summary, start: e.start, end: e.end ?? e.start, hue: e.hue })),
    [events]);

  const timedEvents = useMemo(() =>
    events.filter((e) => !e.allDay && (!e.end || e.end.getTime() - e.start.getTime() < 86400000)),
    [events]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ParsedEvent[]>();
    days.forEach((d) => map.set(d.toDateString(), []));
    timedEvents.forEach((e) => {
      const key = e.start.toDateString();
      map.get(key)?.push(e);
    });
    map.forEach((arr) => arr.sort((a, b) => a.start.getTime() - b.start.getTime()));
    return map;
  }, [days, timedEvents]);

  const weekStarts = [days[0], days[7]];

  return (
    <div className="cal-wrap" data-density="regular">
      {/* Day-of-week header */}
      <div className="dow-row">
        {Array.from({ length: 7 }, (_, i) => {
          const d = days[i];
          const weekend = d.getDay() === 0 || d.getDay() === 6;
          return (
            <div key={i} className={`dow${weekend ? ' weekend' : ''}`}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}
            </div>
          );
        })}
      </div>

      <div className="grid">
        {weekStarts.map((weekStart, wIdx) => {
          const { bars, laneCount } = layoutSpans(spans, weekStart, 7);
          const stripRoom = laneCount > 0 ? laneCount * 28 + 8 : 0;

          return (
            <div key={wIdx} className="week-row">
              {/* Multi-day span strip */}
              <div className="span-strip" style={{ height: stripRoom }}>
                {bars.map(({ span, startCol, endCol, lane, continuesLeft, continuesRight }) => {
                  const colSpan = endCol - startCol + 1;
                  const base = spanStyle(span.hue, dark);
                  const dot = (base as React.CSSProperties & { '--dot'?: string })['--dot'];
                  const style: React.CSSProperties = {
                    ...base,
                    left: `calc(${(startCol / 7) * 100}% + 4px)`,
                    width: `calc(${(colSpan / 7) * 100}% - 8px)`,
                    top: lane * 28,
                    borderLeft: continuesLeft ? 'none' : `3px solid ${dot}`,
                  };
                  let cls = 'span';
                  if (continuesLeft)  cls += ' cont-l';
                  if (continuesRight) cls += ' cont-r';
                  return (
                    <div key={span.id} className={cls} style={style} title={span.summary}>
                      {span.summary}
                    </div>
                  );
                })}
              </div>

              {/* Day cells */}
              {Array.from({ length: 7 }, (_, dIdx) => {
                const date = addDays(weekStart, dIdx);
                const isToday   = isSameDay(date, today);
                const isPast    = date < today && !isToday;
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                const showMonth = date.getDate() === 1 || (wIdx === 0 && dIdx === 0);
                const dayEvts   = eventsByDay.get(date.toDateString()) ?? [];
                const visible   = dayEvts.slice(0, 3);
                const overflow  = dayEvts.length - visible.length;

                let cls = 'day';
                if (isWeekend) cls += ' weekend';
                if (isToday)   cls += ' today';
                if (isPast)    cls += ' past';

                return (
                  <div key={dIdx} className={cls}>
                    <div className="day-hd">
                      <span className="day-num">{date.getDate()}</span>
                      {showMonth && (
                        <span className="day-mo">{MONTHS[date.getMonth()]}</span>
                      )}
                    </div>
                    <div className="day-events" style={{ '--strip-room': `${stripRoom}px` } as React.CSSProperties}>
                      {visible.map((e) => (
                        <div key={e.id} className="evt" style={evtStyle(e.hue, dark)}>
                          <span className="ttl">{e.summary}</span>
                          <span className="t">{fmtTime(e.start)}</span>
                        </div>
                      ))}
                      {overflow > 0 && <div className="more">+{overflow} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
