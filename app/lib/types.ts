export type EventData = {
  id: string;
  summary: string;
  start: number;   // ms timestamp
  end: number | null;
  allDay: boolean;
  calendarIndex: number;
  hue: number | null;       // category hue if matched, else null
  categoryName: string | null;
};

export type ParsedEvent = {
  id: string;
  summary: string;
  start: Date;
  end: Date | null;
  allDay: boolean;
  calendarIndex: number;
  hue: number | null;
  categoryName: string | null;
};
