# InfiniteTimeline component split — design

## Problem

`src/components/InfiniteTimeline.tsx` (458 lines) mixes four unrelated concerns
in one file: a hard-coded cosmic-event data catalogue, pure
date/formatting helpers, the entire canvas rendering pipeline (~250 lines),
and the React component (refs, effects, mouse/wheel handlers, hover state,
JSX). This makes the file hard to navigate and review — a "God object".

This is a pure refactor: no behavioral change. Pan/zoom/click/hover must
work identically afterward.

## File breakdown

All new files live under `src/components/timeline/`, following the existing
flat-file convention (`ViewSelection.tsx`, `ZoomRangeControl.tsx`).

- **`categories/markerEras.ts`** — `MarkerEra` type + `MARKER_ERAS` data (the
  `ERAS` catalogue: Big Bang, First Stars, Moon Landing, etc.). Placed in
  `categories/` alongside the other data catalogues. Named `markerEras.ts`
  rather than `eras.ts` because `categories/eras.ts` already exists and
  exports `GEOLOGICAL_ERAS`/`ERA_STYLE` — a different concept (period
  *bands*, not point-in-time *markers*). Reusing the name would collide.

- **`yearFormat.ts`** — `niceInterval`, `formatYear`, `decimalYearToDate`.
  Pure, dependency-free year math/formatting. No React, no canvas — testable
  in isolation like `periodTree.test.ts`.

- **`drawTimeline.ts`** — `MarkerHit` type, `drawPeriods`, `draw`. The full
  canvas rendering pipeline: takes a 2D context + `TimelineStore` + selected
  year + dimensions, returns hit regions (`MarkerHit[]`). No React.

- **`useTimelineCanvas.ts`** — custom hook owning all imperative/interaction
  state: `canvasRef`, `containerRef`, drag ref, hits ref, hover state, the
  resize (`ResizeObserver`) and MobX `autorun` effects, and the mouse/wheel
  handlers. A shared `findHit(x, y)` helper de-dupes the hit-test logic
  currently repeated between `onMouseMove` and `onMouseUp`. Returns refs,
  `hover`, and the event handlers for the container div.

- **`TimelineHoverCard.tsx`** — small presentational component. Given
  `hover` (label/description/position) and `canvasWidth`, renders the
  tooltip box, or nothing when `hover` is null.

- **`InfiniteTimeline.tsx`** (root, unchanged location) — shrinks to a
  composition root (~35-40 lines): calls `useTimelineCanvas()`, renders the
  container div with the returned handlers spread on, the `<canvas>`,
  `ViewSelection`, `ZoomRangeControl`, `TimelineHoverCard`, and the static
  hint text.

## Data flow

Unchanged from today. `useTimelineCanvas`'s internal `redraw` still reads
`root.astroChart.decimalYear` so MobX's `autorun` tracks it, and still calls
`store.setYear/setMonth/setDay` on a non-drag click. `draw()` keeps its
current signature and return value.

## Testing

No existing tests cover `InfiniteTimeline.tsx`. Verification is: type-check
build passes, and manual check in the dev server that pan, zoom, click-to-set-date,
and hover tooltips still behave identically. `yearFormat.ts` is a natural
candidate for unit tests but none are added unless requested.
