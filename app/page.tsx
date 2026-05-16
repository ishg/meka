import { fetchEvents } from '@/app/lib/calendar';
import { readConfig, matchCategory } from '@/app/lib/config';
import CalendarApp from '@/app/components/CalendarApp';
import type { EventData } from '@/app/lib/types';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const [{ main, celebrations }, cfg] = await Promise.all([fetchEvents(), readConfig()]);

  const todayMs = Date.now();

  const decorate = (e: (typeof main)[number]): EventData => {
    const cat = matchCategory(e.summary, cfg.categories);
    return {
      id: e.id,
      summary: e.summary,
      start: e.start.getTime(),
      end: e.end?.getTime() ?? null,
      allDay: e.allDay,
      calendarIndex: e.calendarIndex,
      hue: cat?.hue ?? null,
      categoryName: cat?.name ?? null,
    };
  };

  const mainEvents: EventData[] = main.map(decorate);
  const celebrationEvents: EventData[] = celebrations
    .filter((e) => {
      const endMs = e.end?.getTime() ?? e.start.getTime();
      return endMs >= todayMs - 86400000; // include today and future
    })
    .map(decorate);

  return (
    <CalendarApp
      events={mainEvents}
      celebrations={celebrationEvents}
      todayMs={todayMs}
    />
  );
}
