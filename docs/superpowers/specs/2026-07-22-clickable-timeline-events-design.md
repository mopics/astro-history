# Clickable Timeline Markers → AstroChart Form

**Goal:** Clicking any marker on the timeline canvas — a hard-coded era (`MARKER_ERAS`, e.g. Big Bang, K-Pg Extinction) or a user-created timeline event (`TimelineStore.events`) — updates the `AstroChartStore` form (day/month/year/time/lat/lon) with whatever date/location fields that marker carries. Fields the marker doesn't carry are left untouched.

**Non-goals:** Changing the `TimelineEvent` schema (all six fields remain required for user events). Changing the empty-space "click to set date" behavior. Adding hover tooltips to markers that don't already have a `description`.

## Current state (for context)

- `drawTimeline.ts`'s `draw()` returns a `MarkerHit[]` — pixel-space hit regions built while rendering. Today a hit is only pushed **if the marker has a `description`** (`if (era.description) hits.push(...)` / `if (ev.description) hits.push(...)`), so most eras (which mostly have no description) are currently inert — not hoverable, not clickable.
- `useTimelineCanvas.ts`'s `findHit()` does radius-based lookup against the latest `hits` array. `onMouseMove` uses it to show `TimelineHoverCard`. `onMouseUp` uses it to distinguish "clicked a marker" (today: just re-sets `hover`) from "clicked empty space" (sets `astroChart.year/month/day` from the click's x-position via `pixelToYear` + `decimalYearToDate`).
- `MARKER_ERAS` (`categories/markerEras.ts`) only ever have a `year` — no day/month/time/lat/lon.
- `TimelineStore.events` (`TimelineEvent`) always have all six fields populated — enforced by `NOT NULL` columns in `timeline_events` and by both client and server validation in `createTimelineEvent`.

## Architecture

Reuse the existing hit-testing pipeline — no parallel system, no store changes.

### 1. `MarkerHit` gains `chartFields`

```ts
// drawTimeline.ts
export type ChartFields = {
  day?: number
  month?: number
  year?: number
  time?: number
  lat?: number
  lon?: number
}

export type MarkerHit = {
  x: number; y: number; radius: number
  label: string
  description: string
  chartFields: ChartFields
}
```

### 2. Both marker loops push a hit unconditionally

- `MARKER_ERAS` loop: push a hit for every rendered era (still gated by the existing `era.priority > minPriority` visibility filter — unchanged), with `chartFields: { year: era.year }` and `description: era.description ?? ''`.
- `store.events` loop: push a hit for every rendered event, with `chartFields: { day: ev.day, month: ev.month, year: ev.year, time: ev.time, lat: ev.lat, lon: ev.lon }` and `description: ev.description`.

This is the actual fix for "all events clickable" — removing the `if (...description)` gate around `hits.push(...)` in both loops.

### 3. A pure `applyChartFields` helper

New small pure function (co-located in `useTimelineCanvas.ts`, unit-tested in isolation — no canvas/DOM needed):

```ts
function applyChartFields(chart: AstroChartStore, fields: ChartFields) {
  if (fields.day   !== undefined) chart.setDay(fields.day)
  if (fields.month !== undefined) chart.setMonth(fields.month)
  if (fields.year  !== undefined) chart.setYear(fields.year)
  if (fields.time  !== undefined) chart.setTime(fields.time)
  if (fields.lat   !== undefined) chart.setLat(fields.lat)
  if (fields.lon   !== undefined) chart.setLon(fields.lon)
}
```

Each `AstroChartStore` setter is called independently, so a Big Bang click only calls `setYear`, leaving day/month/time/lat/lon exactly as they were; a full user-event click calls all six.

### 4. `onMouseUp` click handling

Current "hit" branch just re-sets `hover`. New behavior:

```ts
if (hit) {
  if (hit.description) setHover({ x: px, y: my, label: hit.label, description: hit.description })
  applyChartFields(root.astroChart, hit.chartFields)
} else {
  // unchanged: empty-space click sets day/month/year from cursor position
}
```

### 5. `onMouseMove` hover gating

Unchanged in spirit, but now needs an explicit description check since hits exist for every marker:

```ts
const hit = findHit(hitsRef.current, mx, my)
setHover(hit && hit.description ? { x: mx, y: my, label: hit.label, description: hit.description } : null)
```

So description-less markers (most eras) become click-eligible with no hover tooltip — matches today's visual behavior for those markers except that clicking now does something.

### 6. Hint text

`InfiniteTimeline.tsx`'s bottom-right hint (`click to set date · drag to pan · scroll to zoom`) gets a mention of clicking a marker, e.g.:

`click marker to load info · click empty space to set date · drag to pan · scroll to zoom`

## Edge cases

- **Extreme years (Big Bang, First Stars, etc.):** `setYear` is called with the era's raw year (e.g. `-13_800_000_000`), same as any manual entry outside the Year field's `-9999..9999` soft bounds. If the astro chart API can't compute positions for it, the existing `AstroChartStore.error` banner surfaces the API's error — no special-casing, no clamping.
- **Panning:** unaffected — `onMouseUp` only runs this logic when `!drag.current.moved`, same as today.
- **Click on a description-less marker:** chart fields still apply; no tooltip shown (per above).
- **Overlapping markers:** `findHit` already just returns the first radius match in array order; unchanged, not addressed by this feature.

## Testing plan

- Unit test `applyChartFields` (new, pure): given a fake `AstroChartStore`-shaped object with spy setters, verify only the setters for present keys are called, with correct values, for representative field subsets (year-only, all-six, empty object).
- Manual verification via `npm run dev` (no component-test infra in this repo, per existing convention — see `docs/superpowers/plans/2026-07-19-period-tree-view.md`'s Global Constraints):
  1. Click a description-less era marker (e.g. "Agriculture") → Year field updates to that era's year; day/month/time/lat/lon unchanged; no tooltip appears.
  2. Click a described era marker (e.g. "Life on Earth") → same as above, plus tooltip shows on hover (before and after click).
  3. Click a user-created event → all six fields update to the event's stored values.
  4. Click Big Bang → Year field shows `-13800000000`; if the chart API errors, the existing error banner appears (not a crash).
  5. Click empty timeline space → only day/month/year update from cursor position, exactly as before this change.
  6. Drag-pan across a marker → no chart field changes, no tooltip stuck open.
