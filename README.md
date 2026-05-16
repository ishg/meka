# meka

A kitchen calendar dashboard built for a 10" tablet on the counter. Reads one or more private ICS feeds, merges them, and renders a 2-week grid + 30-day timeline. A separate "celebrations" feed powers a Coming-up panel for birthdays and anniversaries.

## Features

- **2-week grid view** — day cells with timed events and multi-day span bars.
- **Timeline view** — 30-day horizontal scrollable timeline with a live "now" line.
- **Coming up** panel — celebrations from a designated calendar, grouped into This week / Next week / Later, with red urgency for anything in the next 10 days.
- **Categories** — assign colors to events whose title contains a substring (case-insensitive). First match wins.
- **Light / dark theme** toggle.
- **No build step required** for config — the admin page writes a JSON file on the server.

## Setup

```bash
npm install
cp .env.local.example .env.local   # then edit
npm run dev
```

Open <http://localhost:3000>.

### Environment

Add private ICS URLs as a comma-separated list:

```
CALENDAR_ICS_URLS=https://cal.example.com/secret1.ics,https://cal.example.com/secret2.ics
```

Google Calendar private addresses (`...basic.ics`) work directly — auth lives in the URL.

### Admin

Visit `/admin` (gear icon in the header) to:

1. Pick which calendar feeds the **Coming up** panel — those events are then excluded from the main views.
2. Add **categories**: name + substring + color. Events matching the substring use that category's color.

Settings persist to `data/config.json` (gitignored).

## Stack

- **Next.js 16** (App Router, Turbopack, Server Actions)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4** for the reset; design CSS lives in `app/globals.css`
- **node-ical** for server-side ICS fetching (must be in `serverExternalPackages` — see `next.config.ts`)
- **Heroicons** for all icons
- **Inter** + **Roboto Mono** via `next/font/google`

## Project layout

```
app/
  page.tsx                  server component — fetches events, splits celebrations, applies categories
  layout.tsx                fonts + theme attribute
  globals.css               all design CSS
  admin/
    page.tsx                settings UI
    actions.ts              "use server" actions (saveCelebrationsCalendar, addCategory, deleteCategory)
  components/
    CalendarApp.tsx         shell with view toggle and theme
    TwoWeekView.tsx         2-week grid
    ScrollView.tsx          30-day timeline
    CelebrationsPanel.tsx   right-hand "Coming up" list
  lib/
    calendar.ts             fetchEvents() — reads CALENDAR_ICS_URLS, parses ICS, normalizes all-day DTEND
    config.ts               read/write data/config.json + matchCategory()
    colors.ts               hue palette + oklch color derivation
    dateHelpers.ts          isSameDay, addDays, fmtTime, etc.
    layoutHelpers.ts        multi-day span lane packing
    types.ts                EventData / ParsedEvent
data/
  config.json               runtime settings (gitignored)
```

## Notes

- Tuned for ~1280×800 tablets at counter distance — fonts are larger than a typical web app.
- ICS DTEND for all-day events is exclusive; `calendar.ts` subtracts a day so end-dates display correctly.
- All Date objects cross the server/client boundary as `number` timestamps and are revived in `CalendarApp`.
- If CSS edits don't show up after a hot reload, restart `npm run dev` and clear `.next/` — Turbopack occasionally misses changes to `globals.css`.
