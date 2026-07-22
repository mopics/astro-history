# Clickable Timeline Markers → AstroChart Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking any marker on the timeline canvas — a hard-coded era (`MARKER_ERAS`) or a user-created timeline event (`TimelineStore.events`) — updates the `AstroChartStore` form (day/month/year/time/lat/lon) with whatever fields that marker carries, leaving fields it doesn't carry untouched.

**Architecture:** Extend the existing `MarkerHit` hit-testing pipeline (`drawTimeline.ts` produces hits, `useTimelineCanvas.ts` consumes them) with a `chartFields` payload per hit, add a small pure `applyChartFields` helper to apply only the present fields to the chart store, and wire it into the existing click handler. No store schema changes, no parallel hit-testing system.

**Tech Stack:** React 18, TypeScript, MobX (`mobx`/`mobx-react-lite`), Vite, Vitest.

## Global Constraints

- Design source: `docs/superpowers/specs/2026-07-22-clickable-timeline-events-design.md`.
- Reuse the existing `MarkerHit` pipeline in `drawTimeline.ts` / `useTimelineCanvas.ts` — do not build a parallel hit-testing system, do not change `TimelineStore` or `AstroChartStore`'s existing fields/schema.
- `TimelineEvent` stays exactly as-is — all six fields (day/month/year/time/lat/lon) remain required for user events; only `MARKER_ERAS` ever has a partial field set (`year` only).
- Empty-space click behavior (sets day/month/year from cursor x-position via `pixelToYear`/`decimalYearToDate`) must not change.
- Extreme-year clicks (e.g. Big Bang) call `AstroChartStore.setYear` directly with the raw value — no clamping, no special-casing. If the chart API can't compute it, the existing `AstroChartStore.error` banner is the only feedback mechanism.
- Hover tooltip must continue to show only when a marker's `description` is truthy, even though every marker becomes click-eligible in this plan (today only markers with a description get a hit region at all).
- No new test infrastructure (no jsdom/testing-library) — the repo has no frontend component/canvas tests today. Unit-test only pure logic (the new `applyChartFields` helper) with Vitest; verify canvas/DOM behavior manually via `npm run dev`, matching the convention already used in `docs/superpowers/plans/2026-07-19-period-tree-view.md`.

---

### Task 1: Carry `chartFields` on every marker hit, gate hover on description

**Files:**
- Modify: `src/components/timeline/drawTimeline.ts`
- Modify: `src/components/timeline/useTimelineCanvas.ts`

**Interfaces:**
- Consumes: nothing new from other tasks.
- Produces:
  - `export type ChartFields = { day?: number; month?: number; year?: number; time?: number; lat?: number; lon?: number }` (in `drawTimeline.ts`)
  - `MarkerHit` gains `chartFields: ChartFields`
  - Every `MarkerHit` pushed by `draw()` (both the `MARKER_ERAS` loop and the `store.events` loop) now happens unconditionally instead of only when `description` is truthy.

This task alone must not introduce empty hover tooltips: description-less markers get a hit region (for later tasks to use) but `onMouseMove` is updated in this same task to only show the tooltip when `hit.description` is truthy, so hover behavior is unchanged from before this task.

- [ ] **Step 1: Add `ChartFields` and extend `MarkerHit`**

In `src/components/timeline/drawTimeline.ts`, replace:

```ts
// A hoverable/clickable marker region, in canvas pixel space, for a
// hard-coded era or a user timeline event that has a description.
export type MarkerHit = { x: number; y: number; radius: number; label: string; description: string }
```

with:

```ts
// Date/location fields a marker is known to carry. Eras only ever carry
// `year`; user timeline events carry all six.
export type ChartFields = {
  day?: number
  month?: number
  year?: number
  time?: number
  lat?: number
  lon?: number
}

// A hoverable/clickable marker region, in canvas pixel space, for a
// hard-coded era or a user timeline event.
export type MarkerHit = {
  x: number; y: number; radius: number
  label: string
  description: string
  chartFields: ChartFields
}
```

- [ ] **Step 2: Push era hits unconditionally, with `chartFields`**

In the same file, inside the `MARKER_ERAS` loop, replace:

```ts
    if (era.description) {
      hits.push({ x: px, y: lineY - 2, radius: 10, label: era.label, description: era.description })
    }
```

with:

```ts
    hits.push({
      x: px,
      y: lineY - 2,
      radius: 10,
      label: era.label,
      description: era.description ?? '',
      chartFields: { year: era.year },
    })
```

- [ ] **Step 3: Push event hits unconditionally, with `chartFields`**

In the same file, inside the `store.events` loop, replace:

```ts
    if (ev.description) {
      hits.push({ x: px, y: lineY + 7.5, radius: 9, label: ev.name, description: ev.description })
    }
```

with:

```ts
    hits.push({
      x: px,
      y: lineY + 7.5,
      radius: 9,
      label: ev.name,
      description: ev.description,
      chartFields: { day: ev.day, month: ev.month, year: ev.year, time: ev.time, lat: ev.lat, lon: ev.lon },
    })
```

- [ ] **Step 4: Gate hover on `description` in `useTimelineCanvas.ts`**

In `src/components/timeline/useTimelineCanvas.ts`, inside `onMouseMove`, replace:

```ts
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const hit = findHit(hitsRef.current, mx, my)
    setHover(hit ? { x: mx, y: my, label: hit.label, description: hit.description } : null)
```

with:

```ts
    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const hit = findHit(hitsRef.current, mx, my)
    setHover(hit && hit.description ? { x: mx, y: my, label: hit.label, description: hit.description } : null)
```

- [ ] **Step 5: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual regression check (hover unchanged)**

Run: `npm run dev`
Open the printed localhost URL, find the timeline panel, and confirm:
1. Hovering a description-less era marker (e.g. "Agriculture", "Bronze Age", "Cambrian") shows **no** tooltip — same as before this change.
2. Hovering a described era marker (e.g. "Life on Earth", "K-Pg Extinction") **does** show its tooltip, same as before this change.
3. No errors in the browser console.

Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 7: Commit**

```bash
git add src/components/timeline/drawTimeline.ts src/components/timeline/useTimelineCanvas.ts
git commit -m "Carry chartFields on every marker hit, gate hover on description"
```

---

### Task 2: Add the pure `applyChartFields` helper

**Files:**
- Modify: `src/components/timeline/useTimelineCanvas.ts`
- Test: `src/components/timeline/useTimelineCanvas.test.ts`

**Interfaces:**
- Consumes: `ChartFields` from `./drawTimeline` (Task 1).
- Produces: `export function applyChartFields(chart: ChartFieldSetters, fields: ChartFields): void`, where `ChartFieldSetters = { setDay: (v: number) => void; setMonth: (v: number) => void; setYear: (v: number) => void; setTime: (v: number) => void; setLat: (v: number) => void; setLon: (v: number) => void }`. `AstroChartStore` already structurally satisfies `ChartFieldSetters` (it has all six setters), so no changes to `AstroChartStore` are needed.

- [ ] **Step 1: Write the failing test**

Create `src/components/timeline/useTimelineCanvas.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { applyChartFields } from './useTimelineCanvas'

function createChartSpy() {
  return {
    setDay: vi.fn(),
    setMonth: vi.fn(),
    setYear: vi.fn(),
    setTime: vi.fn(),
    setLat: vi.fn(),
    setLon: vi.fn(),
  }
}

describe('applyChartFields', () => {
  it('calls only the setters for fields that are present', () => {
    const chart = createChartSpy()
    applyChartFields(chart, { year: -13_800_000_000 })

    expect(chart.setYear).toHaveBeenCalledWith(-13_800_000_000)
    expect(chart.setDay).not.toHaveBeenCalled()
    expect(chart.setMonth).not.toHaveBeenCalled()
    expect(chart.setTime).not.toHaveBeenCalled()
    expect(chart.setLat).not.toHaveBeenCalled()
    expect(chart.setLon).not.toHaveBeenCalled()
  })

  it('calls every setter when all fields are present', () => {
    const chart = createChartSpy()
    applyChartFields(chart, { day: 5, month: 3, year: 1974, time: 12, lat: 5, lon: 4 })

    expect(chart.setDay).toHaveBeenCalledWith(5)
    expect(chart.setMonth).toHaveBeenCalledWith(3)
    expect(chart.setYear).toHaveBeenCalledWith(1974)
    expect(chart.setTime).toHaveBeenCalledWith(12)
    expect(chart.setLat).toHaveBeenCalledWith(5)
    expect(chart.setLon).toHaveBeenCalledWith(4)
  })

  it('calls no setters when given an empty object', () => {
    const chart = createChartSpy()
    applyChartFields(chart, {})

    expect(chart.setDay).not.toHaveBeenCalled()
    expect(chart.setMonth).not.toHaveBeenCalled()
    expect(chart.setYear).not.toHaveBeenCalled()
    expect(chart.setTime).not.toHaveBeenCalled()
    expect(chart.setLat).not.toHaveBeenCalled()
    expect(chart.setLon).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/components/timeline/useTimelineCanvas.test.ts`
Expected: FAIL — `applyChartFields` is not exported from `./useTimelineCanvas` yet.

- [ ] **Step 3: Implement the helper**

In `src/components/timeline/useTimelineCanvas.ts`, update the import from `./drawTimeline` — replace:

```ts
import { draw, type MarkerHit } from './drawTimeline'
```

with:

```ts
import { draw, type MarkerHit, type ChartFields } from './drawTimeline'
```

Then add the following after the imports (before `function findHit`):

```ts
type ChartFieldSetters = {
  setDay: (v: number) => void
  setMonth: (v: number) => void
  setYear: (v: number) => void
  setTime: (v: number) => void
  setLat: (v: number) => void
  setLon: (v: number) => void
}

export function applyChartFields(chart: ChartFieldSetters, fields: ChartFields) {
  if (fields.day   !== undefined) chart.setDay(fields.day)
  if (fields.month !== undefined) chart.setMonth(fields.month)
  if (fields.year  !== undefined) chart.setYear(fields.year)
  if (fields.time  !== undefined) chart.setTime(fields.time)
  if (fields.lat   !== undefined) chart.setLat(fields.lat)
  if (fields.lon   !== undefined) chart.setLon(fields.lon)
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run src/components/timeline/useTimelineCanvas.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/timeline/useTimelineCanvas.ts src/components/timeline/useTimelineCanvas.test.ts
git commit -m "Add pure applyChartFields helper for marker-click chart updates"
```

---

### Task 3: Wire marker clicks into the AstroChart form

**Files:**
- Modify: `src/components/timeline/useTimelineCanvas.ts`
- Modify: `src/components/InfiniteTimeline.tsx`

**Interfaces:**
- Consumes: `applyChartFields` (Task 2); `chartFields` on `MarkerHit` (Task 1); `root.astroChart` (existing `AstroChartStore` instance from `useRootStore()`, already used elsewhere in this file).
- Produces: no new exports — this task changes `onMouseUp`'s behavior and a text string, both internal to already-exported components/hooks.

This task has no automated test (canvas click behavior — no component-test infra, see Global Constraints). Verification is manual, via the dev server, against the checklist in Step 3.

- [ ] **Step 1: Call `applyChartFields` on marker click**

In `src/components/timeline/useTimelineCanvas.ts`, inside `onMouseUp`, replace:

```ts
      const hit = findHit(hitsRef.current, px, my)
      if (hit) {
        setHover({ x: px, y: my, label: hit.label, description: hit.description })
      } else {
```

with:

```ts
      const hit = findHit(hitsRef.current, px, my)
      if (hit) {
        if (hit.description) setHover({ x: px, y: my, label: hit.label, description: hit.description })
        applyChartFields(root.astroChart, hit.chartFields)
      } else {
```

- [ ] **Step 2: Update the hint text**

In `src/components/InfiniteTimeline.tsx`, replace:

```tsx
      <span className="absolute bottom-2 right-3 text-[10px] text-slate-700 pointer-events-none">
        click to set date · drag to pan · scroll to zoom
      </span>
```

with:

```tsx
      <span className="absolute bottom-2 right-3 text-[10px] text-slate-700 pointer-events-none">
        click marker to load info · click empty space to set date · drag to pan · scroll to zoom
      </span>
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors.

- [ ] **Step 4: Manual verification in the browser**

Run: `npm run dev`
Open the printed localhost URL and confirm, on the timeline panel:

1. Click a description-less era marker (e.g. "Agriculture") → the AstroChart Year field updates to that era's year; Day/Month/Time/Lat/Lon fields are unchanged; no tooltip appears.
2. Click a described era marker (e.g. "Life on Earth") → Year field updates the same way; tooltip shows (both on hover before the click and immediately after the click, since it's also the hover target).
3. Click a user-created event (add one via "Add Event" first if none exist) → all six AstroChart fields (Day/Month/Year/Time/Lat/Lon) update to that event's stored values.
4. Click the "BIG BANG" marker → Year field shows `-13800000000`; either the chart renders (if the API can handle it) or the existing red error banner appears — no crash either way.
5. Click empty timeline space (not on any marker) → only Day/Month/Year update, based on the clicked position, exactly as before this plan (Time/Lat/Lon unchanged).
6. Drag-pan the timeline across several markers → no AstroChart fields change during the pan, and no tooltip stays stuck open after releasing.
7. No errors in the browser console during any of the above.

Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 5: Commit**

```bash
git add src/components/timeline/useTimelineCanvas.ts src/components/InfiniteTimeline.tsx
git commit -m "Wire marker clicks into the AstroChart form"
```
