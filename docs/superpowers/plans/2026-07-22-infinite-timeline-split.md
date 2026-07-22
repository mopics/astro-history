# InfiniteTimeline Component Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `src/components/InfiniteTimeline.tsx` (458 lines, mixing data, pure helpers, canvas rendering, and the React component) into six focused files, with no behavior change.

**Architecture:** Extract, one concern at a time, into `src/components/timeline/`: a marker-era data catalogue, pure year formatting helpers, the canvas rendering pipeline, a presentational hover-tooltip component, and a `useTimelineCanvas` hook that owns all refs/effects/handlers. `InfiniteTimeline.tsx` ends as a ~40-line composition root.

**Tech Stack:** React 18, TypeScript, MobX (`mobx`, `mobx-react-lite`), Vite, Canvas 2D API. No test framework changes — this repo uses `vitest` (see `src/components/timeline/periodTree.test.ts`) but this plan doesn't add new tests (see Global Constraints).

## Global Constraints

- Pure refactor: no behavioral change. Pan, zoom, click-to-set-date, and hover tooltips must work identically before and after.
- Follow the existing flat-file convention already used in `src/components/timeline/` (e.g. `ViewSelection.tsx`, `ZoomRangeControl.tsx`) — no new subfolders beyond the existing `categories/`.
- New marker-era data file is named `markerEras.ts`, not `eras.ts` — `src/components/timeline/categories/eras.ts` already exists and exports `GEOLOGICAL_ERAS`/`ERA_STYLE` (period *bands*), a different concept from the point-in-time cosmic event *markers* being extracted here. Reusing the name would collide.
- Because this is a mechanical, behavior-preserving refactor of already-working canvas/React code (not new logic), verification per task is a TypeScript type-check (`npx tsc -p tsconfig.app.json --noEmit`) rather than new unit tests, per the approved design doc (`docs/superpowers/specs/2026-07-22-infinite-timeline-split-design.md`). The final task adds a full build plus a manual smoke test in the dev server.
- Every intermediate commit must leave the app in a compiling, working state — do not batch multiple extractions into one commit.

---

### Task 1: Extract the marker-era data catalogue

**Files:**
- Create: `src/components/timeline/categories/markerEras.ts`
- Modify: `src/components/InfiniteTimeline.tsx`

**Interfaces:**
- Produces: `MarkerEra` type (`{ year: number; label: string; color: string; priority: number; size: number; description?: string }`), `MARKER_ERAS: MarkerEra[]` — consumed by Task 3's `drawTimeline.ts`.

- [ ] **Step 1: Create `src/components/timeline/categories/markerEras.ts`**

```typescript
export type MarkerEra = { year: number; label: string; color: string; priority: number; size: number, description?: string }

// Point-in-time cosmic/historical milestones drawn as markers on the
// timeline axis. Distinct from the TimeBand-based period categories in
// this same folder (e.g. `eras.ts`'s GEOLOGICAL_ERAS, which are bands).
export const MARKER_ERAS: MarkerEra[] = [
  { year: -13_800_000_000, label: 'BIG BANG', color: '#ff6b35', priority: 1, size: 13 },
  { year: -13_500_000_000, label: 'First Stars', color: '#ffd700', priority: 2, size: 11 },
  { year: -13_200_000_000, label: 'First Galaxies', color: '#a78bfa', priority: 2, size: 11 },
  { year: -4_600_000_000, label: 'Solar System', color: '#60a5fa', priority: 1, size: 12 },
  { year: -3_800_000_000, label: 'Life on Earth', color: '#4ade80', priority: 1, size: 12, description: `Het eerste leven op aarde, dat zo'n 3,8 tot 4 miljard jaar geleden ontstond, bestond uit microscopisch kleine, eencellige organismen. Deze oerbacteriën (prokaryoten) hadden geen celkern, dreven rond in de oceanen en leefden waarschijnlijk in de buurt van hete, onderwater-warmwaterbronnen.` },
  { year: -2_460_000_000, label: 'Great Oxidation Event', color: '#a78bfa', priority: 2, size: 11, description: `The Great Oxidation Event (GOE) or Great Oxygenation Event, also called the Oxygen Catastrophe, Oxygen Revolution, Oxygen Crisis, or Oxygen Holocaust,[2] was a time interval during the Earth's Paleoproterozoic era when the Earth's atmosphere and shallow seas first experienced a rise in the concentration of free oxygen.[3] This began approximately 2.46–2.426 billion years ago (Ga) during the Siderian period and ended around 2.06 billion years ago during the Rhyacian.[4] Geological, isotopic, and chemical evidence suggests that biologically produced molecular oxygen (dioxygen or O2) started to accumulate in the Archean prebiotic atmosphere by microbial photosynthesis. It changed the atmosphere from a weakly reducing state practically devoid of oxygen into an oxidizing one containing abundant free oxygen,[5] with oxygen levels being as high as 10% of the modern atmospheric level by the end of the GOE.` },
  { year: -2_000_000_000, label: 'Cells with Cores', color: '#4ade80', priority: 1, size: 12, description: `https://www.uu.nl/nieuws/tijdlijn-van-vroege-eukaryote-evolutie` },
  { year: -1_200_000_000, label: 'Development of Sexes', color: '#4ade80', priority: 2, size: 11, description: `Distinct biological sexes evolved over a billion years ago. The earliest evidence of sexual reproduction dates back to roughly \(1.2\) billion years ago with the appearance of Bangiomorpha pubescens, an ancient type of algae. This species utilized distinct male and female reproductive cells rather than cloning.` },
  { year: -541_000_000, label: 'Cambrian', color: '#86efac', priority: 2, size: 11 },
  { year: -252_000_000, label: 'Great Dying', color: '#f87171', priority: 2, size: 11 },
  { year: -66_000_000, label: 'K-Pg Extinction', color: '#fb923c', priority: 2, size: 11, description: `De Krijt-Paleogeengrens (ook wel Krijt-Tertiairgrens, afgekort K-Pg-grens of K-T-grens; in het Engels: K-T Boundary) is de overgang tussen de geologische tijdperken Krijt (K) en Paleogeen (Pg). In gesteenten is deze overgang terug te vinden als een dunne sedimentlaag, die verrijkt is met het zeldzame element iridium. Tijdens deze overgang vond een massa-extinctie plaats, waarbij veel soorten dieren en planten verdwenen. Deze gebeurtenis wordt de Krijt-Paleogeenmassa-extinctie (of Krijt-Tertiairmassa-extinctie) genoemd. Recente dateringen wijzen op een ouderdom van 65,95 miljoen jaar.[1]` },
  { year: -3_300_000, label: 'Hominids', color: '#d4a574', priority: 3, size: 10 },
  { year: -10_000, label: 'Agriculture', color: '#fbbf24', priority: 3, size: 10 },
  { year: -3_000, label: 'Bronze Age', color: '#e2b96a', priority: 4, size: 10 },
  { year: 0, label: 'Common Era', color: '#cbd5e1', priority: 3, size: 10 },
  { year: 1440, label: 'Printing Press', color: '#c4b5fd', priority: 4, size: 10 },
  { year: 1969, label: 'Moon Landing', color: '#a78bfa', priority: 4, size: 10 },
]
```

- [ ] **Step 2: Remove the catalogue from `InfiniteTimeline.tsx` and import it instead**

In `src/components/InfiniteTimeline.tsx` (lines 10-36 of the original file), replace:

```typescript
// ── Cosmic event catalogue ──────────────────────────────────────────────────

type Era = { year: number; label: string; color: string; priority: number; size: number, description?: string }

// A hoverable/clickable marker region, in canvas pixel space, for a
// hard-coded era or a user timeline event that has a description.
type MarkerHit = { x: number; y: number; radius: number; label: string; description: string }

const ERAS: Era[] = [
  { year: -13_800_000_000, label: 'BIG BANG', color: '#ff6b35', priority: 1, size: 13 },
  { year: -13_500_000_000, label: 'First Stars', color: '#ffd700', priority: 2, size: 11 },
  { year: -13_200_000_000, label: 'First Galaxies', color: '#a78bfa', priority: 2, size: 11 },
  { year: -4_600_000_000, label: 'Solar System', color: '#60a5fa', priority: 1, size: 12 },
  { year: -3_800_000_000, label: 'Life on Earth', color: '#4ade80', priority: 1, size: 12, description: `Het eerste leven op aarde, dat zo'n 3,8 tot 4 miljard jaar geleden ontstond, bestond uit microscopisch kleine, eencellige organismen. Deze oerbacteriën (prokaryoten) hadden geen celkern, dreven rond in de oceanen en leefden waarschijnlijk in de buurt van hete, onderwater-warmwaterbronnen.` },
  { year: -2_460_000_000, label: 'Great Oxidation Event', color: '#a78bfa', priority: 2, size: 11, description: `The Great Oxidation Event (GOE) or Great Oxygenation Event, also called the Oxygen Catastrophe, Oxygen Revolution, Oxygen Crisis, or Oxygen Holocaust,[2] was a time interval during the Earth's Paleoproterozoic era when the Earth's atmosphere and shallow seas first experienced a rise in the concentration of free oxygen.[3] This began approximately 2.46–2.426 billion years ago (Ga) during the Siderian period and ended around 2.06 billion years ago during the Rhyacian.[4] Geological, isotopic, and chemical evidence suggests that biologically produced molecular oxygen (dioxygen or O2) started to accumulate in the Archean prebiotic atmosphere by microbial photosynthesis. It changed the atmosphere from a weakly reducing state practically devoid of oxygen into an oxidizing one containing abundant free oxygen,[5] with oxygen levels being as high as 10% of the modern atmospheric level by the end of the GOE.` },
  { year: -2_000_000_000, label: 'Cells with Cores', color: '#4ade80', priority: 1, size: 12, description: `https://www.uu.nl/nieuws/tijdlijn-van-vroege-eukaryote-evolutie` },
  { year: -1_200_000_000, label: 'Development of Sexes', color: '#4ade80', priority: 2, size: 11, description: `Distinct biological sexes evolved over a billion years ago. The earliest evidence of sexual reproduction dates back to roughly \(1.2\) billion years ago with the appearance of Bangiomorpha pubescens, an ancient type of algae. This species utilized distinct male and female reproductive cells rather than cloning.` },
  { year: -541_000_000, label: 'Cambrian', color: '#86efac', priority: 2, size: 11 },
  { year: -252_000_000, label: 'Great Dying', color: '#f87171', priority: 2, size: 11 },
  { year: -66_000_000, label: 'K-Pg Extinction', color: '#fb923c', priority: 2, size: 11, description: `De Krijt-Paleogeengrens (ook wel Krijt-Tertiairgrens, afgekort K-Pg-grens of K-T-grens; in het Engels: K-T Boundary) is de overgang tussen de geologische tijdperken Krijt (K) en Paleogeen (Pg). In gesteenten is deze overgang terug te vinden als een dunne sedimentlaag, die verrijkt is met het zeldzame element iridium. Tijdens deze overgang vond een massa-extinctie plaats, waarbij veel soorten dieren en planten verdwenen. Deze gebeurtenis wordt de Krijt-Paleogeenmassa-extinctie (of Krijt-Tertiairmassa-extinctie) genoemd. Recente dateringen wijzen op een ouderdom van 65,95 miljoen jaar.[1]` },
  { year: -3_300_000, label: 'Hominids', color: '#d4a574', priority: 3, size: 10 },
  { year: -10_000, label: 'Agriculture', color: '#fbbf24', priority: 3, size: 10 },
  { year: -3_000, label: 'Bronze Age', color: '#e2b96a', priority: 4, size: 10 },
  { year: 0, label: 'Common Era', color: '#cbd5e1', priority: 3, size: 10 },
  { year: 1440, label: 'Printing Press', color: '#c4b5fd', priority: 4, size: 10 },
  { year: 1969, label: 'Moon Landing', color: '#a78bfa', priority: 4, size: 10 },
]
```

with:

```typescript
// A hoverable/clickable marker region, in canvas pixel space, for a
// hard-coded era or a user timeline event that has a description.
type MarkerHit = { x: number; y: number; radius: number; label: string; description: string }
```

(i.e. delete the `// ── Cosmic event catalogue ──` header comment, the `type Era` declaration, and the entire `const ERAS: Era[] = [...]` array, keeping only the `MarkerHit` type and its comment.)

Add the import at the top of the file, alongside the other `./timeline/...` imports:

```typescript
import { MARKER_ERAS } from './timeline/categories/markerEras'
```

Finally, update the one usage site — inside `draw()`, change:

```typescript
  for (const era of ERAS) {
```

to:

```typescript
  for (const era of MARKER_ERAS) {
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/timeline/categories/markerEras.ts src/components/InfiniteTimeline.tsx
git commit -m "Extract marker-era catalogue out of InfiniteTimeline"
```

---

### Task 2: Extract year formatting helpers

**Files:**
- Create: `src/components/timeline/yearFormat.ts`
- Modify: `src/components/InfiniteTimeline.tsx`

**Interfaces:**
- Produces: `niceInterval(rough: number): number`, `formatYear(year: number): string`, `decimalYearToDate(y: number): { year: number; month: number; day: number }` — consumed by Task 3's `drawTimeline.ts` (`niceInterval`, `formatYear`) and Task 5's `useTimelineCanvas.ts` (`decimalYearToDate`).

- [ ] **Step 1: Create `src/components/timeline/yearFormat.ts`**

```typescript
export function niceInterval(rough: number): number {
  if (rough <= 0) return 1
  const steps = [
    0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500,
    1_000, 2_000, 5_000, 10_000, 50_000, 100_000, 500_000,
    1_000_000, 5_000_000, 10_000_000, 50_000_000, 100_000_000, 500_000_000,
    1_000_000_000, 5_000_000_000, 10_000_000_000,
  ]
  return steps.find(s => s >= rough) ?? steps[steps.length - 1]
}

export function formatYear(year: number): string {
  const abs = Math.abs(year)
  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(abs % 500_000_000 === 0 ? 0 : 1)} Bya`
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(abs % 500_000 === 0 ? 0 : 1)} Mya`
  if (abs >= 10_000) return `${Math.round(abs / 1000)}k ${year < 0 ? 'BCE' : 'CE'}`
  if (year < 0) return `${abs} BCE`
  if (year === 0) return '0 CE'
  return `${year} CE`
}

export function decimalYearToDate(y: number): { year: number; month: number; day: number } {
  const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const year = Math.floor(y)
  const frac = y - year
  const monthFloat = frac * 12
  const month = Math.max(1, Math.min(12, Math.ceil(monthFloat) || 1))
  const isLeap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const dim = month === 2 && isLeap ? 29 : DAYS[month - 1]
  const dayFrac = monthFloat - Math.floor(monthFloat)
  const day = Math.max(1, Math.min(dim, Math.round(dayFrac * dim) || 1))
  return { year, month, day }
}
```

- [ ] **Step 2: Remove the helpers from `InfiniteTimeline.tsx` and import them instead**

Delete this entire block from `src/components/InfiniteTimeline.tsx` (the `// ── Helpers ──` section):

```typescript
// ── Helpers ─────────────────────────────────────────────────────────────────

function niceInterval(rough: number): number {
  if (rough <= 0) return 1
  const steps = [
    0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500,
    1_000, 2_000, 5_000, 10_000, 50_000, 100_000, 500_000,
    1_000_000, 5_000_000, 10_000_000, 50_000_000, 100_000_000, 500_000_000,
    1_000_000_000, 5_000_000_000, 10_000_000_000,
  ]
  return steps.find(s => s >= rough) ?? steps[steps.length - 1]
}

function formatYear(year: number): string {
  const abs = Math.abs(year)
  if (abs >= 1_000_000_000) return `${(abs / 1_000_000_000).toFixed(abs % 500_000_000 === 0 ? 0 : 1)} Bya`
  if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(abs % 500_000 === 0 ? 0 : 1)} Mya`
  if (abs >= 10_000) return `${Math.round(abs / 1000)}k ${year < 0 ? 'BCE' : 'CE'}`
  if (year < 0) return `${abs} BCE`
  if (year === 0) return '0 CE'
  return `${year} CE`
}

function decimalYearToDate(y: number): { year: number; month: number; day: number } {
  const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const year = Math.floor(y)
  const frac = y - year
  const monthFloat = frac * 12
  const month = Math.max(1, Math.min(12, Math.ceil(monthFloat) || 1))
  const isLeap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const dim = month === 2 && isLeap ? 29 : DAYS[month - 1]
  const dayFrac = monthFloat - Math.floor(monthFloat)
  const day = Math.max(1, Math.min(dim, Math.round(dayFrac * dim) || 1))
  return { year, month, day }
}
```

Add the import at the top of the file:

```typescript
import { niceInterval, formatYear, decimalYearToDate } from './timeline/yearFormat'
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/timeline/yearFormat.ts src/components/InfiniteTimeline.tsx
git commit -m "Extract year formatting helpers out of InfiniteTimeline"
```

---

### Task 3: Extract the canvas rendering pipeline

**Files:**
- Create: `src/components/timeline/drawTimeline.ts`
- Modify: `src/components/InfiniteTimeline.tsx`

**Interfaces:**
- Consumes: `TIMELINE_CATEGORIES` from `./categories` (already exists), `MARKER_ERAS` from `./categories/markerEras` (Task 1), `niceInterval`/`formatYear` from `./yearFormat` (Task 2), `TimelineStore` type from `../../stores/TimelineStore`.
- Produces: `MarkerHit` type (`{ x: number; y: number; radius: number; label: string; description: string }`), `draw(ctx: CanvasRenderingContext2D, store: TimelineStore, selectedDecimalYear: number, W: number, H: number): MarkerHit[]` — consumed by Task 5's `useTimelineCanvas.ts`.

- [ ] **Step 1: Create `src/components/timeline/drawTimeline.ts`**

```typescript
import type { TimelineStore } from '../../stores/TimelineStore'
import { TIMELINE_CATEGORIES } from './categories'
import { MARKER_ERAS } from './categories/markerEras'
import { niceInterval, formatYear } from './yearFormat'

// A hoverable/clickable marker region, in canvas pixel space, for a
// hard-coded era or a user timeline event that has a description.
export type MarkerHit = { x: number; y: number; radius: number; label: string; description: string }

function drawPeriods(
  ctx: CanvasRenderingContext2D,
  store: TimelineStore,
  W: number,
  H: number,
) {
  for (const category of TIMELINE_CATEGORIES) {
    if (!store.visibleCategories[category.key]) continue
    const { style } = category
    const bands = category.getBands ? category.getBands(store.yearPerPx) : category.bands

    for (const band of bands) {
      const startPx = store.yearToPixel(band.start, W)
      const endPx = store.yearToPixel(band.end ?? store.nowYear, W)
      if (endPx < 0 || startPx > W) continue

      const x0 = Math.max(0, startPx)
      const x1 = Math.min(W, endPx)
      const bw = x1 - x0
      if (bw < 2) continue

      ctx.save()

      ctx.globalAlpha = style.alpha
      ctx.fillStyle = band.color
      ctx.fillRect(x0, 0, bw, H)

      if (startPx >= 0 && startPx <= W) {
        ctx.globalAlpha = style.alpha * 1.5
        ctx.strokeStyle = band.color
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(startPx, 0)
        ctx.lineTo(startPx, H)
        ctx.stroke()
      }

      if (bw > 40) {
        ctx.beginPath()
        ctx.rect(x0 + 2, 0, bw - 4, H)
        ctx.clip()

        const lx = (x0 + x1) / 2
        ctx.globalAlpha = style.labelAlpha
        ctx.fillStyle = '#c8d8e8'
        ctx.font = `${style.fontSize}px ui-monospace, monospace`
        ctx.textAlign = 'center'
        ctx.fillText(band.label.toUpperCase(), lx, style.labelY)
      }

      ctx.restore()
    }
  }
}

export function draw(
  ctx: CanvasRenderingContext2D,
  store: TimelineStore,
  selectedDecimalYear: number,
  W: number,
  H: number,
): MarkerHit[] {
  const hits: MarkerHit[] = []

  ctx.fillStyle = '#07090f'
  ctx.fillRect(0, 0, W, H)

  const lineY = Math.round(H * 0.58)

  // ── geological period bands ──
  drawPeriods(ctx, store, W, H)

  // ── gradient history band ──
  const bbPx = store.yearToPixel(store.bigBangYear, W)
  const nowPx = store.yearToPixel(store.nowYear, W)
  const x0 = Math.max(0, bbPx)
  const x1 = Math.min(W, nowPx)
  if (x1 > x0) {
    const grad = ctx.createLinearGradient(x0, 0, x1, 0)
    grad.addColorStop(0, '#ff6b3530')
    grad.addColorStop(0.35, '#1e3a5f60')
    grad.addColorStop(0.85, '#16453060')
    grad.addColorStop(1, '#4ade8060')
    ctx.strokeStyle = grad
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.4
    ctx.beginPath(); ctx.moveTo(x0, lineY); ctx.lineTo(x1, lineY); ctx.stroke()
    ctx.globalAlpha = 1
  }

  // base axis
  ctx.strokeStyle = '#1e2a3a'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(0, lineY); ctx.lineTo(W, lineY); ctx.stroke()

  // ── tick marks ──
  const visibleYears = W * store.yearPerPx
  const interval = niceInterval(visibleYears / 8)
  const startYear = store.pixelToYear(0, W)
  const endYear = store.pixelToYear(W, W)
  const firstTick = Math.ceil(startYear / interval) * interval

  ctx.font = '10px ui-monospace, monospace'
  ctx.textAlign = 'center'

  for (let y = firstTick; y <= endYear + interval; y += interval) {
    const px = store.yearToPixel(y, W)
    if (px < -40 || px > W + 40) continue
    const isMajor = Math.abs((y / (interval * 5)) - Math.round(y / (interval * 5))) < 0.001
    const tickH = isMajor ? 9 : 4
    ctx.strokeStyle = isMajor ? '#334155' : '#1e293b'
    ctx.lineWidth = isMajor ? 1 : 0.5
    ctx.beginPath()
    ctx.moveTo(px, lineY - tickH); ctx.lineTo(px, lineY + tickH)
    ctx.stroke()
    if (isMajor) {
      ctx.fillStyle = '#475569'
      ctx.fillText(formatYear(y), px, lineY + tickH + 14)
    }
  }

  // ── era / event markers ──
  const minPriority =
    visibleYears < 500 ? 5
      : visibleYears < 50_000 ? 4
        : visibleYears < 1e8 ? 3
          : visibleYears < 2e9 ? 2
            : 1

  for (const era of MARKER_ERAS) {
    if (era.priority > minPriority) continue
    const px = store.yearToPixel(era.year, W)
    if (px < -120 || px > W + 120) continue

    ctx.save()
    ctx.strokeStyle = era.color + '55'
    ctx.lineWidth = era.priority === 1 ? 1.5 : 1
    ctx.setLineDash([3, 4])
    ctx.beginPath()
    ctx.moveTo(px, lineY - 8); ctx.lineTo(px, lineY - 44)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = era.color
    ctx.beginPath()
    ctx.moveTo(px, lineY - 8)
    ctx.lineTo(px + 4, lineY - 2)
    ctx.lineTo(px, lineY + 4)
    ctx.lineTo(px - 4, lineY - 2)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = era.color
    ctx.font = `${era.priority === 1 ? 'bold ' : ''}${era.size}px sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(era.label, px, lineY - 52)
    ctx.restore()

    if (era.description) {
      hits.push({ x: px, y: lineY - 2, radius: 10, label: era.label, description: era.description })
    }
  }

  // ── BIG BANG radial glow ──
  if (bbPx > -60 && bbPx < W + 60) {
    const rg = ctx.createRadialGradient(bbPx, lineY, 0, bbPx, lineY, 36)
    rg.addColorStop(0, '#ff6b3555')
    rg.addColorStop(0.5, '#ff6b3515')
    rg.addColorStop(1, 'transparent')
    ctx.fillStyle = rg
    ctx.beginPath()
    ctx.arc(bbPx, lineY, 36, 0, Math.PI * 2)
    ctx.fill()
  }

  // ── NOW marker ──
  if (nowPx > -4 && nowPx < W + 4) {
    ctx.save()
    ctx.strokeStyle = '#4ade80'
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.7
    ctx.setLineDash([3, 3])
    ctx.beginPath(); ctx.moveTo(nowPx, 8); ctx.lineTo(nowPx, H - 8); ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1
    ctx.fillStyle = '#4ade80'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = nowPx > W - 50 ? 'right' : 'left'
    ctx.fillText('NOW', nowPx + (nowPx > W - 50 ? -10 : 10), 20)
    ctx.restore()
  }

  // ── User timeline events ──
  for (const ev of store.events) {
    const decYear = ev.year + (ev.month - 1) / 12 + (ev.day - 1) / 365.25
    const px = store.yearToPixel(decYear, W)
    if (px < -150 || px > W + 150) continue

    ctx.save()
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 3])
    ctx.beginPath()
    ctx.moveTo(px, lineY + 8)
    ctx.lineTo(px, lineY + 32)
    ctx.stroke()
    ctx.setLineDash([])

    // square marker on the axis
    ctx.fillStyle = '#cbd5e1'
    const s = 5
    ctx.fillRect(px - s / 2, lineY + 5, s, s)

    // name label below
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(ev.name, px, lineY + 46)
    ctx.restore()

    if (ev.description) {
      hits.push({ x: px, y: lineY + 7.5, radius: 9, label: ev.name, description: ev.description })
    }
  }

  // ── Selected date marker ──
  const selPx = store.yearToPixel(selectedDecimalYear, W)
  if (selPx > -4 && selPx < W + 4) {
    ctx.save()
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    ctx.beginPath(); ctx.moveTo(selPx, 8); ctx.lineTo(selPx, H - 8); ctx.stroke()
    ctx.setLineDash([])

    // diamond on the axis
    ctx.fillStyle = '#38bdf8'
    ctx.beginPath()
    ctx.moveTo(selPx, lineY - 8)
    ctx.lineTo(selPx + 5, lineY)
    ctx.lineTo(selPx, lineY + 8)
    ctx.lineTo(selPx - 5, lineY)
    ctx.closePath()
    ctx.fill()

    ctx.font = 'bold 11px sans-serif'
    ctx.fillStyle = '#38bdf8'
    ctx.textAlign = selPx > W - 80 ? 'right' : 'left'
    ctx.fillText(formatYear(selectedDecimalYear), selPx + (selPx > W - 80 ? -10 : 10), H - 14)
    ctx.restore()
  }

  return hits
}
```

- [ ] **Step 2: Remove the rendering pipeline from `InfiniteTimeline.tsx` and import it instead**

In `src/components/InfiniteTimeline.tsx`, delete the contiguous block that starts with:

```typescript
// A hoverable/clickable marker region, in canvas pixel space, for a
// hard-coded era or a user timeline event that has a description.
type MarkerHit = { x: number; y: number; radius: number; label: string; description: string }
```

and ends with the closing `}` of the `draw` function (the line `}` right before the `// ── Component ──` comment). This block is the `MarkerHit` type, the `// ── Canvas renderer ──` header comment, `drawPeriods`, and `draw` — byte-for-byte the same code you just wrote into `drawTimeline.ts` in Step 1 above (from `function drawPeriods(` through `draw`'s closing `return hits }`), plus the `MarkerHit` type and its two-line comment immediately preceding it.

Remove these now-unused imports from the top of the file:

```typescript
import type { TimelineStore } from '../stores/TimelineStore'
import { TIMELINE_CATEGORIES } from './timeline/categories'
import { MARKER_ERAS } from './timeline/categories/markerEras'
```

Remove the now-unused `niceInterval, formatYear` from the yearFormat import (keep `decimalYearToDate`, still used later in this file):

```typescript
import { decimalYearToDate } from './timeline/yearFormat'
```

Add the import for the extracted renderer:

```typescript
import { draw, type MarkerHit } from './timeline/drawTimeline'
```

At this point `src/components/InfiniteTimeline.tsx` should contain only: imports, the `InfiniteTimeline` component itself (refs, effects, handlers, JSX). Confirm no other reference to `drawPeriods`, `niceInterval`, `formatYear`, `TIMELINE_CATEGORIES`, or `MARKER_ERAS` remains in this file — the component's `redraw` callback calls `draw(ctx, store, sel, canvas.width, canvas.height)`, unchanged from before except it now resolves to the imported function.

- [ ] **Step 3: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors, no "unused import" warnings.

- [ ] **Step 4: Commit**

```bash
git add src/components/timeline/drawTimeline.ts src/components/InfiniteTimeline.tsx
git commit -m "Extract canvas rendering pipeline out of InfiniteTimeline"
```

---

### Task 4: Extract the hover tooltip into a presentational component

**Files:**
- Create: `src/components/timeline/TimelineHoverCard.tsx`
- Modify: `src/components/InfiniteTimeline.tsx`

**Interfaces:**
- Produces: `HoverInfo` type (`{ x: number; y: number; label: string; description: string }`), `TimelineHoverCard({ hover, canvasWidth }: { hover: HoverInfo | null; canvasWidth: number })` — consumed by Task 5's `useTimelineCanvas.ts` (imports the `HoverInfo` type) and by `InfiniteTimeline.tsx` (renders the component).

- [ ] **Step 1: Create `src/components/timeline/TimelineHoverCard.tsx`**

```tsx
export type HoverInfo = { x: number; y: number; label: string; description: string }

export function TimelineHoverCard({ hover, canvasWidth }: { hover: HoverInfo | null; canvasWidth: number }) {
  if (!hover) return null
  return (
    <div
      className="absolute z-20 max-w-xs pointer-events-none rounded-md border border-slate-700/60 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 shadow-lg backdrop-blur-sm"
      style={{
        left: Math.max(8, Math.min(hover.x + 14, canvasWidth - 288)),
        top: hover.y < 100 ? hover.y + 14 : hover.y - 14,
        transform: hover.y < 100 ? undefined : 'translateY(-100%)',
      }}
    >
      <div className="mb-1 font-semibold text-slate-100">{hover.label}</div>
      <div className="leading-snug text-slate-300">{hover.description}</div>
    </div>
  )
}
```

- [ ] **Step 2: Use it from `InfiniteTimeline.tsx`**

In `src/components/InfiniteTimeline.tsx`, change the `hover` state declaration from:

```typescript
  const [hover, setHover] = useState<{ x: number; y: number; label: string; description: string } | null>(null)
```

to:

```typescript
  const [hover, setHover] = useState<HoverInfo | null>(null)
```

Add the import:

```typescript
import { TimelineHoverCard, type HoverInfo } from './timeline/TimelineHoverCard'
```

Replace the inline tooltip JSX:

```tsx
      {hover && (
        <div
          className="absolute z-20 max-w-xs pointer-events-none rounded-md border border-slate-700/60 bg-slate-900/95 px-3 py-2 text-xs text-slate-200 shadow-lg backdrop-blur-sm"
          style={{
            left: Math.max(8, Math.min(hover.x + 14, (canvasRef.current?.width ?? 9999) - 288)),
            top: hover.y < 100 ? hover.y + 14 : hover.y - 14,
            transform: hover.y < 100 ? undefined : 'translateY(-100%)',
          }}
        >
          <div className="mb-1 font-semibold text-slate-100">{hover.label}</div>
          <div className="leading-snug text-slate-300">{hover.description}</div>
        </div>
      )}
```

with:

```tsx
      <TimelineHoverCard hover={hover} canvasWidth={canvasRef.current?.width ?? 9999} />
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/timeline/TimelineHoverCard.tsx src/components/InfiniteTimeline.tsx
git commit -m "Extract hover tooltip into TimelineHoverCard"
```

---

### Task 5: Extract the canvas interaction hook

**Files:**
- Create: `src/components/timeline/useTimelineCanvas.ts`
- Modify: `src/components/InfiniteTimeline.tsx`

**Interfaces:**
- Consumes: `draw`, `type MarkerHit` from `./drawTimeline` (Task 3); `decimalYearToDate` from `./yearFormat` (Task 2); `type HoverInfo` from `./TimelineHoverCard` (Task 4); `useRootStore` from `../../stores/StoreContext`.
- Produces: `useTimelineCanvas()` returning `{ containerRef: RefObject<HTMLDivElement>, canvasRef: RefObject<HTMLCanvasElement>, hover: HoverInfo | null, onMouseDown, onMouseMove, onMouseUp, onMouseLeave, onWheel }` — consumed by the final `InfiniteTimeline.tsx` composition root.

- [ ] **Step 1: Create `src/components/timeline/useTimelineCanvas.ts`**

```typescript
import { useCallback, useEffect, useRef, useState } from 'react'
import { autorun } from 'mobx'
import { useRootStore } from '../../stores/StoreContext'
import { draw, type MarkerHit } from './drawTimeline'
import { decimalYearToDate } from './yearFormat'
import type { HoverInfo } from './TimelineHoverCard'

function findHit(hits: MarkerHit[], x: number, y: number): MarkerHit | undefined {
  return hits.find(h => Math.hypot(h.x - x, h.y - y) <= h.radius)
}

export function useTimelineCanvas() {
  const root = useRootStore()
  const store = root.timeline
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Track drag state + whether mouse moved (to distinguish click from pan)
  const drag = useRef<{ x: number; center: number; moved: boolean } | null>(null)
  // Hoverable/clickable marker regions from the most recent draw
  const hitsRef = useRef<MarkerHit[]>([])
  const [hover, setHover] = useState<HoverInfo | null>(null)

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Access decimalYear here so MobX autorun tracks it
    const sel = root.astroChart.decimalYear
    hitsRef.current = draw(ctx, store, sel, canvas.width, canvas.height)
  }, [store, root])

  // resize → redraw
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect
      canvas.width = Math.round(width)
      canvas.height = Math.round(height)
      store.setCanvasWidth(canvas.width)
      redraw()
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [redraw, store])

  // MobX → redraw
  useEffect(() => autorun(redraw), [redraw])

  // drag / click
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    drag.current = { x: e.clientX, center: store.viewCenterYear, moved: false }
  }, [store])

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return
    if (drag.current) {
      const dx = e.clientX - drag.current.x
      if (Math.abs(dx) > 4) drag.current.moved = true
      store.panTo(drag.current.center - dx * store.yearPerPx)
      setHover(null)
      return
    }

    const rect = canvasRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const hit = findHit(hitsRef.current, mx, my)
    setHover(hit ? { x: mx, y: my, label: hit.label, description: hit.description } : null)
  }, [store])

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    if (drag.current && !drag.current.moved && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const px = e.clientX - rect.left
      const my = e.clientY - rect.top
      const hit = findHit(hitsRef.current, px, my)
      if (hit) {
        setHover({ x: px, y: my, label: hit.label, description: hit.description })
      } else {
        const decYear = store.pixelToYear(px, canvasRef.current.width)
        const { year, month, day } = decimalYearToDate(decYear)
        root.astroChart.setYear(year)
        root.astroChart.setMonth(month)
        root.astroChart.setDay(day)
      }
    }
    drag.current = null
  }, [store, root])

  const onMouseLeave = useCallback(() => { drag.current = null; setHover(null) }, [])

  // scroll to zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left
    const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15
    store.zoomAt(factor, px, canvasRef.current.width)
  }, [store])

  return {
    containerRef,
    canvasRef,
    hover,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onWheel,
  }
}
```

- [ ] **Step 2: Rewrite `InfiniteTimeline.tsx` as the composition root**

Replace the full contents of `src/components/InfiniteTimeline.tsx` with:

```tsx
import { observer } from 'mobx-react-lite'
import { ViewSelection } from './timeline/ViewSelection'
import { ZoomRangeControl } from './timeline/ZoomRangeControl'
import { TimelineHoverCard } from './timeline/TimelineHoverCard'
import { useTimelineCanvas } from './timeline/useTimelineCanvas'

export const InfiniteTimeline = observer(() => {
  const {
    containerRef, canvasRef, hover,
    onMouseDown, onMouseMove, onMouseUp, onMouseLeave, onWheel,
  } = useTimelineCanvas()

  return (
    <div
      ref={containerRef}
      className={`h-full w-full relative overflow-hidden select-none ${hover ? 'cursor-help' : 'cursor-crosshair'}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      onWheel={onWheel}
    >
      <canvas ref={canvasRef} className="block" />
      <ViewSelection />
      <ZoomRangeControl />
      <TimelineHoverCard hover={hover} canvasWidth={canvasRef.current?.width ?? 9999} />
      <span className="absolute bottom-2 right-3 text-[10px] text-slate-700 pointer-events-none">
        click to set date · drag to pan · scroll to zoom
      </span>
    </div>
  )
})
```

- [ ] **Step 3: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/timeline/useTimelineCanvas.ts src/components/InfiniteTimeline.tsx
git commit -m "Extract canvas interaction hook out of InfiniteTimeline"
```

---

### Task 6: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full build**

Run: `npm run build:client`
Expected: builds successfully with no TypeScript or Vite errors.

- [ ] **Step 2: Run existing test suite**

Run: `npm test`
Expected: all existing tests still pass (this refactor doesn't touch `periodTree.ts`, `categories/index.ts`, or `TimelineStore.ts` behavior, so `periodTree.test.ts`, `categories/index.test.ts`, and `TimelineStore.test.ts` should be unaffected).

- [ ] **Step 3: Manual smoke test in the dev server**

Run: `npm run dev`, open the app in a browser, and on the timeline:
- Drag to pan — the view should scroll smoothly, no jump.
- Scroll to zoom in/out — zoom should anchor under the cursor.
- Click an empty area of the axis — the astro chart's date should update to the clicked year/month/day.
- Hover a marker era with a description (e.g. "Life on Earth" or "K-Pg Extinction") — the tooltip should appear with the correct label/description.
- Hover a user timeline event with a description (if any exist) — same tooltip behavior.
- Toggle categories in the `ViewSelection` tree and confirm period bands still draw/hide correctly.
- Use `ZoomRangeControl` to zoom to a specific range and confirm it still works.

Expected: all behavior identical to before the refactor (no visual or interaction regressions).

- [ ] **Step 4: Confirm file sizes**

Run: `wc -l src/components/InfiniteTimeline.tsx src/components/timeline/drawTimeline.ts src/components/timeline/useTimelineCanvas.ts src/components/timeline/TimelineHoverCard.tsx src/components/timeline/yearFormat.ts src/components/timeline/categories/markerEras.ts`
Expected: `InfiniteTimeline.tsx` is now roughly 35-40 lines; no single file exceeds ~260 lines (`drawTimeline.ts`, the largest, holding the canvas rendering pipeline).
