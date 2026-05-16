'use client';

import { useMemo } from 'react';
import { daysBetween, fmtMonthDay, weekdayShort } from '@/app/lib/dateHelpers';
import { colorsForHue, DEFAULT_SPAN_HUE } from '@/app/lib/colors';
import type { ParsedEvent } from '@/app/lib/types';

type Props = { events: ParsedEvent[]; today: Date };

type Bucket = 'thisWeek' | 'nextWeek' | 'later';
const BUCKET_LABEL: Record<Bucket, string> = {
  thisWeek: 'This week',
  nextWeek: 'Next week',
  later:    'Later',
};
const BUCKET_ORDER: Bucket[] = ['thisWeek', 'nextWeek', 'later'];

function bucketFor(diffDays: number): Bucket {
  if (diffDays <= 7) return 'thisWeek';
  if (diffDays <= 14) return 'nextWeek';
  return 'later';
}

function relativeLabel(diff: number): { label: string; urgency: 'soon' | 'far' } {
  if (diff <= 0) return { label: 'Today', urgency: 'soon' };
  if (diff === 1) return { label: 'Tomorrow', urgency: 'soon' };
  const soon = diff < 10;
  if (diff < 30) return { label: `in ${diff} days`, urgency: soon ? 'soon' : 'far' };
  if (diff < 60) return { label: `in ${Math.round(diff / 7)} weeks`, urgency: 'far' };
  return { label: `in ${Math.round(diff / 30)} mo`, urgency: 'far' };
}

export default function CelebrationsPanel({ events, today }: Props) {
  const grouped = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
    const map = new Map<Bucket, ParsedEvent[]>();
    for (const e of sorted) {
      const b = bucketFor(daysBetween(today, e.start));
      const arr = map.get(b) ?? [];
      arr.push(e);
      map.set(b, arr);
    }
    return map;
  }, [events, today]);

  const count = events.length;

  return (
    <div className="pane right-pane">
      <div className="r-hd">
        <h2>Coming up</h2>
      </div>

      {count === 0 ? (
        <div className="celebs">
          <div className="empty-state">
            <p>No upcoming celebrations</p>
            <p className="muted small">Pick a calendar in Settings →</p>
          </div>
        </div>
      ) : (
        <div className="celebs">
          {BUCKET_ORDER.flatMap((bucket) => {
            const items = grouped.get(bucket);
            if (!items || items.length === 0) return [];
            return [
              <div key={`hdr-${bucket}`} className="celeb-group">{BUCKET_LABEL[bucket]}</div>,
              ...items.map((e) => {
                const hue = e.hue ?? DEFAULT_SPAN_HUE;
                const colors = colorsForHue(hue, false);
                const rel = relativeLabel(daysBetween(today, e.start));
                return (
                  <div
                    key={e.id}
                    className="celeb"
                    style={{ '--dot': colors.dot } as React.CSSProperties}
                  >
                    <span className="who">{e.summary}</span>
                    <div className="meta">
                      {e.categoryName && <span>{e.categoryName}</span>}
                      <span className="when-day">{weekdayShort(e.start)}</span>
                    </div>
                    <div className="when">
                      <span className="abs">{fmtMonthDay(e.start)}</span>
                      <span className={`rel mono u-${rel.urgency}`}>{rel.label}</span>
                    </div>
                  </div>
                );
              }),
            ];
          })}
        </div>
      )}
    </div>
  );
}
