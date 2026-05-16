import * as ical from 'node-ical';

export type CalendarEvent = {
  id: string;
  summary: string;
  start: Date;
  end: Date | null;
  allDay: boolean;
  calendarIndex: number;
  isCelebration: boolean;
};

export type FetchResult = {
  main: CalendarEvent[];
  celebrations: CalendarEvent[];
};

function resolveString(value: ical.ParameterValue): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'val' in value) return String((value as { val: unknown }).val);
  return String(value);
}

function parseUrls(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);
}

export async function fetchEvents(): Promise<FetchResult> {
  const mainUrls = parseUrls(process.env.CALENDAR_ICS_URLS);
  const celebrationsUrl = (process.env.CELEBRATIONS_ICS_URL ?? '').trim();

  const tasks: Promise<CalendarEvent[]>[] = [];

  mainUrls.forEach((url, i) => tasks.push(fetchCalendar(url, i, false)));
  if (celebrationsUrl) tasks.push(fetchCalendar(celebrationsUrl, mainUrls.length, true));

  const results = await Promise.allSettled(tasks);

  const main: CalendarEvent[] = [];
  const celebrations: CalendarEvent[] = [];
  for (const result of results) {
    if (result.status !== 'fulfilled') {
      console.error('Failed to fetch calendar:', result.reason);
      continue;
    }
    for (const evt of result.value) {
      (evt.isCelebration ? celebrations : main).push(evt);
    }
  }

  main.sort((a, b) => a.start.getTime() - b.start.getTime());
  celebrations.sort((a, b) => a.start.getTime() - b.start.getTime());
  return { main, celebrations };
}

async function fetchCalendar(url: string, calendarIndex: number, isCelebration: boolean): Promise<CalendarEvent[]> {
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
      isCelebration,
    });
  }

  return events;
}
