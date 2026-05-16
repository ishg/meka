import * as ical from 'node-ical';

export type CalendarEvent = {
  id: string;
  summary: string;
  start: Date;
  end: Date | null;
  allDay: boolean;
  calendarIndex: number;
};

function resolveString(value: ical.ParameterValue): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'val' in value) return String((value as { val: unknown }).val);
  return String(value);
}

export async function fetchEvents(): Promise<CalendarEvent[]> {
  const raw = process.env.CALENDAR_ICS_URLS ?? '';
  const urls = raw
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  if (urls.length === 0) return [];

  const results = await Promise.allSettled(
    urls.map((url, index) => fetchCalendar(url, index))
  );

  const events: CalendarEvent[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') events.push(...result.value);
    else console.error('Failed to fetch calendar:', result.reason);
  }

  events.sort((a, b) => a.start.getTime() - b.start.getTime());
  return events;
}

async function fetchCalendar(url: string, calendarIndex: number): Promise<CalendarEvent[]> {
  const data = await ical.async.fromURL(url);
  const events: CalendarEvent[] = [];

  for (const [uid, component] of Object.entries(data)) {
    if (!component || component.type !== 'VEVENT') continue;
    const event = component as ical.VEvent;

    const allDay = event.start.dateOnly === true;
    let end = event.end ?? null;
    // ICS DTEND for all-day events is exclusive (day after last day); make it inclusive
    if (allDay && end) end = new Date(end.getTime() - 86400000);

    events.push({
      id: uid,
      summary: resolveString(event.summary),
      start: event.start,
      end,
      allDay,
      calendarIndex,
    });
  }

  return events;
}
