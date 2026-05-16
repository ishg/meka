import { addDays, daysBetween } from './dateHelpers';

export type Span = {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  hue: number | null;
};

export type PlacedBar = {
  span: Span;
  startCol: number;
  endCol: number;
  lane: number;
  continuesLeft: boolean;
  continuesRight: boolean;
};

export function layoutSpans(
  spans: Span[],
  windowStart: Date,
  cols: number
): { bars: PlacedBar[]; laneCount: number } {
  const windowEnd = addDays(windowStart, cols);

  const active = spans
    .filter((s) => s.end >= windowStart && s.start < windowEnd)
    .map((s) => ({
      span: s,
      startCol: Math.max(0, daysBetween(windowStart, s.start)),
      endCol: Math.min(cols - 1, daysBetween(windowStart, s.end)),
      continuesLeft: s.start < windowStart,
      continuesRight: s.end >= windowEnd,
    }))
    .sort((a, b) => a.startCol - b.startCol || b.endCol - a.endCol);

  const lanes: typeof active[] = [];
  const placed = active.map((bar) => {
    let lane = 0;
    while (
      lanes[lane] &&
      lanes[lane].some(
        (b) => !(b.endCol < bar.startCol || b.startCol > bar.endCol)
      )
    ) {
      lane++;
    }
    if (!lanes[lane]) lanes[lane] = [];
    lanes[lane].push(bar);
    return { ...bar, lane };
  });

  return { bars: placed, laneCount: lanes.length };
}
