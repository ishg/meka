'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { addDays, isSameDay, daysBetween, fmtTimeRange, fmtTime } from '@/app/lib/dateHelpers';
import type { Span } from '@/app/lib/layoutHelpers';
import { colorsForHue, DEFAULT_EVENT_HUE, DEFAULT_SPAN_HUE } from '@/app/lib/colors';
import type { ParsedEvent } from '@/app/lib/types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const HEADER_H    = 76;
const HR_W        = 60;
const PX_PER_HOUR = 72;
const LANE_H      = 28;
const TL_H        = 24 * PX_PER_HOUR;
const DAY_W       = 240;
const DAYS        = 30;

function fmtHr(h: number) {
  if (h === 0)  return '12a';
  if (h === 12) return '12p';
  return h < 12 ? `${h}a` : `${h - 12}p`;
}

const minsToPx = (m: number) => (m / 60) * PX_PER_HOUR;
const eventMins = (d: Date) => d.getHours() * 60 + d.getMinutes();

type Props = { events: ParsedEvent[]; today: Date; dark: boolean };

export default function ScrollView({ events, today, dark }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);

  const [nowMins, setNowMins] = useState<number>(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });

  // Update NOW every minute
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setNowMins(n.getHours() * 60 + n.getMinutes());
    };
    const id = setInterval(tick, 60000);
    return () => clearInterval(id);
  }, []);

  // Scroll to ~6am on mount
  useEffect(() => {
    if (wrapRef.current) wrapRef.current.scrollTop = 6 * PX_PER_HOUR;
  }, []);

  const days = useMemo(() =>
    Array.from({ length: DAYS }, (_, i) => addDays(today, i)), [today]);

  const spans = useMemo((): Span[] =>
    events
      .filter((e) => e.allDay || (e.end && e.end.getTime() - e.start.getTime() >= 86400000))
      .map((e) => ({ id: e.id, summary: e.summary, start: e.start, end: e.end ?? e.start, hue: e.hue })),
    [events]);

  const timedEvents = useMemo(() =>
    events.filter((e) => !e.allDay && (!e.end || e.end.getTime() - e.start.getTime() < 86400000)),
    [events]);

  const { bars, laneCount } = useMemo(() => {
    const windowStart = days[0];
    const active = spans
      .filter((s) => s.end >= windowStart && daysBetween(windowStart, s.start) < DAYS)
      .map((s) => ({
        span: s,
        startCol: Math.max(0, daysBetween(windowStart, s.start)),
        endCol: Math.min(DAYS - 1, daysBetween(windowStart, s.end)),
        continuesLeft: s.start < windowStart,
        continuesRight: daysBetween(windowStart, s.end) >= DAYS,
      }))
      .sort((a, b) => a.startCol - b.startCol || b.endCol - a.endCol);

    const lanes: typeof active[] = [];
    const placed = active.map((bar) => {
      let lane = 0;
      while (lanes[lane] && lanes[lane].some((b) => !(b.endCol < bar.startCol || b.startCol > bar.endCol))) lane++;
      if (!lanes[lane]) lanes[lane] = [];
      lanes[lane].push(bar);
      return { ...bar, lane };
    });
    return { bars: placed, laneCount: lanes.length };
  }, [days, spans]);

  const STRIP_H = laneCount > 0 ? laneCount * LANE_H + 8 : 28;

  const evByDay = useMemo(() => {
    const m = new Map<string, ParsedEvent[]>();
    days.forEach((d) => m.set(d.toDateString(), []));
    timedEvents.forEach((e) => m.get(e.start.toDateString())?.push(e));
    m.forEach((arr) => arr.sort((a, b) => a.start.getTime() - b.start.getTime()));
    return m;
  }, [days, timedEvents]);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const daysW = DAYS * DAY_W;
  const nowStr = (() => {
    const h = Math.floor(nowMins / 60);
    const m = nowMins % 60;
    return fmtTime(new Date(2000, 0, 1, h, m)).toUpperCase();
  })();

  return (
    <div className="scroll-wrap" ref={wrapRef}>
      <div className="sv-inner" style={{ width: HR_W + daysW }}>

        {/* Left gutter — sticky left */}
        <div className="sv-gut" style={{ width: HR_W }}>
          <div className="sv-gut-corner" style={{ height: HEADER_H }} />
          <div className="sv-gut-strip"  style={{ height: STRIP_H, top: HEADER_H }} />
          <div className="sv-gut-divline" style={{ top: HEADER_H + STRIP_H }} />
          <div className="sv-gut-times" style={{ height: TL_H }}>
            {hours.map((h) => (
              <div key={h} className="hr" style={{ top: h * PX_PER_HOUR }}>{fmtHr(h)}</div>
            ))}
            <div className="now-tick" style={{ top: minsToPx(nowMins) }} />
          </div>
        </div>

        {/* Day columns */}
        <div className="sv-right" style={{ width: daysW }}>

          {/* Day header row — sticky top */}
          <div className="sv-band-hd" style={{ height: HEADER_H }}>
            {days.map((date, i) => {
              const isToday   = isSameDay(date, today);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              let cls = 'day-col-hd';
              if (isToday)   cls += ' today';
              if (isWeekend) cls += ' weekend';
              return (
                <div key={i} className={cls} style={{ width: DAY_W, flex: `0 0 ${DAY_W}px` }}>
                  <span className="wd">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][date.getDay()]}{isToday ? ' · TODAY' : ''}</span>
                  <span className="dn">{date.getDate()}<em>{MONTHS[date.getMonth()]}</em></span>
                </div>
              );
            })}
          </div>

          {/* Multi-day strip — sticky top below header */}
          <div className="sv-band-strip" style={{ height: STRIP_H, top: HEADER_H }}>
            <div className="sv-strip-bg">
              {days.map((date, i) => {
                const isToday   = isSameDay(date, today);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                let cls = 'sv-strip-cell';
                if (isToday)   cls += ' today';
                if (isWeekend) cls += ' weekend';
                return <div key={i} className={cls} style={{ width: DAY_W, flex: `0 0 ${DAY_W}px` }} />;
              })}
            </div>
            {bars.map((b) => {
              const colSpan = b.endCol - b.startCol + 1;
              const c = colorsForHue(b.span.hue ?? DEFAULT_SPAN_HUE, dark);
              const style: React.CSSProperties = {
                top: 4 + b.lane * LANE_H,
                left: b.startCol * DAY_W + 4,
                width: colSpan * DAY_W - 8,
                background: c.fill,
                color:      c.ink,
                borderLeft: b.continuesLeft ? 'none' : `3px solid ${c.dot}`,
              };
              return (
                <div key={b.span.id} className="tl-span-bar" style={style} title={b.span.summary}>
                  {b.span.summary}
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="sv-band-divider" style={{ top: HEADER_H + STRIP_H }} />

          {/* Timeline */}
          <div className="sv-band-tl" style={{ height: TL_H }}>
            {days.map((date, i) => {
              const isToday   = isSameDay(date, today);
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const dayEvts   = evByDay.get(date.toDateString()) ?? [];
              let cls = 'day-col-tl';
              if (isToday)   cls += ' today';
              if (isWeekend) cls += ' weekend';

              return (
                <div key={i} className={cls} style={{ width: DAY_W, flex: `0 0 ${DAY_W}px` }}>
                  {hours.map((h) => (
                    <div key={h} className="hr-line" style={{ top: h * PX_PER_HOUR }} />
                  ))}
                  {hours.slice(0, -1).map((h) => (
                    <div key={`h${h}`} className="hr-line half" style={{ top: h * PX_PER_HOUR + PX_PER_HOUR / 2 }} />
                  ))}

                  {dayEvts.map((e) => {
                    const top = minsToPx(eventMins(e.start));
                    const dur = e.end ? (e.end.getTime() - e.start.getTime()) / 60000 : 60;
                    const h   = Math.max(26, minsToPx(dur));
                    const ec  = colorsForHue(e.hue ?? DEFAULT_EVENT_HUE, dark);
                    const style = {
                      top, height: h,
                      background: ec.fill,
                      color:      ec.ink,
                      '--dot':    ec.dot,
                    } as React.CSSProperties;
                    return (
                      <div key={e.id} className={`tl-evt${h < 40 ? ' short' : ''}`} style={style}>
                        <span className="ttl">{e.summary}</span>
                        <span className="t">
                          {e.end ? fmtTimeRange(e.start, e.end) : fmtTime(e.start)}
                        </span>
                      </div>
                    );
                  })}

                  {isToday && (
                    <div className="now-line" style={{ top: minsToPx(nowMins) }}>
                      <span className="now-lbl mono">NOW · {nowStr}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
