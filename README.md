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
cp .env.example .env   # then edit
npm run dev
```

Open <http://localhost:3000>.

### Environment

A single `.env` file at the repo root works for both `npm run dev` and `docker compose`:

```
# Comma-separated list — these populate the main calendar (grid + timeline)
CALENDAR_ICS_URLS=https://cal.example.com/secret1.ics,https://cal.example.com/secret2.ics

# Optional single URL — events from this calendar appear in the "Coming up"
# panel (birthdays, anniversaries, etc) and are excluded from the main views.
CELEBRATIONS_ICS_URL=https://cal.example.com/birthdays.ics

# Timezone (used by the container, optional for dev)
TZ=America/Los_Angeles
```

Google Calendar private addresses (`...basic.ics`) work directly — auth lives in the URL. `.env` is git-ignored.

### Admin

Visit `/admin` (gear icon in the header) to manage **categories**: name + substring + color. Events whose title contains the substring (case-insensitive) use that category's color. First match wins.

Settings persist to `data/config.json` (gitignored).


### Run locally

```bash
docker compose up -d --build
```

App is at <http://localhost:3000>. Compose reads `.env` next to `docker-compose.yml` for the same variables documented in [Environment](#environment) above. TZ defaults to `America/Los_Angeles` when unset.

### Persistence

Category settings managed from `/admin` are stored at `/app/data/config.json` inside the container. The compose file maps `./data` on the host to that path so changes survive restarts and rebuilds. Back up that directory if you care about your settings.

### Updates

```bash
git pull
docker compose up -d --build
```


## Notes

- Tuned for ~1280×800 tablets at counter distance — fonts are larger than a typical web app.
- ICS DTEND for all-day events is exclusive; `calendar.ts` subtracts a day so end-dates display correctly.
- All Date objects cross the server/client boundary as `number` timestamps and are revived in `CalendarApp`.
- If CSS edits don't show up after a hot reload, restart `npm run dev` and clear `.next/` — Turbopack occasionally misses changes to `globals.css`.
