# Astro History

Navigate 13.8 billion years on an infinite timeline and read the sky at any moment in history. Click a date, get a full astrological chart — planets, signs, aspects. Pin personal events to the cosmic record. Powered by Swiss Ephemeris.

---

## Features

- **Infinite Timeline** — pan and zoom from the Big Bang to the present day, with era markers (Solar System, Cambrian, K-Pg, Moon Landing…)
- **Astrological Chart** — planetary positions, signs, degrees, retrograde status, and a classic SVG wheel with aspect lines
- **Click to Chart** — click anywhere on the timeline to instantly set the date and compute the chart for that moment
- **Timeline Events** — save named events with date, location, tags and description; they appear as markers on the timeline
- **Auto-fetch** — chart updates automatically as you change any field, with capped debounce (600 ms / 2 s max)

## Tech Stack

| Layer | Technology |
|---|---|
| Server | [Hono](https://hono.dev/) + [@hono/node-server](https://github.com/honojs/node-server) |
| Ephemeris | [sweph](https://github.com/timotejroiko/sweph) (Swiss Ephemeris Node.js bindings) |
| Database | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — local `db.sqlite` |
| Frontend | React 18 + TypeScript + Vite 6 |
| State | MobX 6 + mobx-react-lite |
| UI | Tailwind CSS v3 + shadcn/ui (dark theme) |
| Charts | SVG (astrological wheel) + Canvas (timeline) |
| Layout | react-resizable-panels |

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+

### Install

```bash
cd astro-history
npm install
```

### Run

```bash
npm run dev
```

This starts both the Hono API server (port **3002**) and the Vite dev server (port **5173**) concurrently.

## API Endpoints

All endpoints are served at `http://localhost:3002/api`.

### Chart

| Method | Path | Description |
|---|---|---|
| `GET` | `/getAstroChart` | Compute a chart. Query params: `day`, `month`, `year`, `time`, `lat`, `lon` |

### Timeline Events

| Method | Path | Description |
|---|---|---|
| `POST` | `/createTimelineEvent` | Create an event |
| `GET` | `/listTimelineEvents` | List all events |
| `GET` | `/getTimelineEvent/:uid` | Get one event by uid |
| `PUT` | `/updateTimelineEvent/:uid` | Partial update |
| `DELETE` | `/deleteTimelineEvent/:uid` | Delete |

**Event shape:**
```json
{
  "uid": "string",
  "name": "string",
  "description": "string",
  "tags": ["string"],
  "day": 5,
  "month": 3,
  "year": 1974,
  "time": 12.0,
  "lat": 5.0,
  "lon": 4.0
}
```

## Project Structure

```
astro-history/
├── astro-server/
│   ├── index.ts              # Hono app entry point
│   ├── lib/
│   │   ├── db.ts             # SQLite initialisation
│   │   └── sweph.ts          # Swiss Ephemeris wrapper
│   └── routes/
│       ├── astroChart.ts     # Chart endpoint
│       └── timelineEvent.ts  # CRUD endpoints
├── src/
│   ├── components/
│   │   ├── AstroChart.tsx    # Chart form + table + wheel
│   │   ├── AstroWheel.tsx    # SVG astrological wheel
│   │   ├── AddEventModal.tsx # Save-event dialog
│   │   └── InfiniteTimeline.tsx # Canvas timeline
│   ├── stores/
│   │   ├── RootStore.ts
│   │   ├── AstroChartStore.ts
│   │   ├── TimelineStore.ts
│   │   └── StoreContext.tsx
│   └── App.tsx
└── db.sqlite                 # Created on first server start
```

## Ephemeris Files

The Swiss Ephemeris data files (`.se1`) are required for accurate planetary calculation and are included under `astro-server/ephe/`. **The bundled files only cover 0 CE to the present.** Charts requested for BCE dates will fail or return incorrect results. Additional files can be downloaded from the [Swiss Ephemeris download page](https://www.astro.com/ftp/swisseph/ephe/).
