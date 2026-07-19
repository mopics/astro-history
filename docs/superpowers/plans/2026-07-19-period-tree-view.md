# Period Tree View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat checkbox list of timeline period categories with a checkable antd Tree grouped by domain (Geological, Historic, Religious, Astronomical).

**Architecture:** Add a `group` field to the existing `TimelineCategory` data model, derive antd tree data from it via a small pure-function helper module, and swap `ViewSelection.tsx`'s checkbox `<ul>` for antd's `<Tree checkable />` wired to a new `TimelineStore.setVisibleCategories` bulk-set action. Canvas rendering in `InfiniteTimeline.tsx` is untouched — it keeps reading `store.visibleCategories` exactly as before.

**Tech Stack:** React 18, TypeScript, MobX (`mobx`/`mobx-react-lite`), Vite, Vitest, Tailwind CSS (shadcn-style HSL CSS variables), antd (newly added).

## Global Constraints

- Design source: `docs/superpowers/specs/2026-07-19-period-tree-view-design.md`.
- Add antd via `npm install antd` with no version pin — resolves to the current latest (v6.x as of this writing). The original spec said "v5" speculatively; `ConfigProvider`/`theme.darkAlgorithm`/`Tree` APIs used in this plan are confirmed current against the live antd docs.
- Theme antd via `ConfigProvider` + `theme.darkAlgorithm`, reusing the app's **existing** CSS custom properties (`hsl(var(--card))`, `hsl(var(--popover))`, `hsl(var(--border))`, `hsl(var(--foreground))`, `hsl(var(--primary))` — defined in `src/index.css`, already consumed by `tailwind.config.js`) as token values. Do not introduce new hardcoded colors.
- `TIMELINE_CATEGORIES` in `src/components/timeline/categories/index.ts` stays a flat array — `InfiniteTimeline.tsx`'s render loop must not need to change.
- No Egypt / other historic-civilization placeholder nodes — out of scope per spec. Historic only gets `european`.
- Default visibility is unchanged: only `yugaCustom` starts checked.
- All 4 tree groups start expanded (`defaultExpandAll`).
- No new test infrastructure (no jsdom/testing-library) — the repo has no frontend component tests today (only `astro-server/**/*.test.ts` via plain Vitest in node environment). Follow that pattern: unit-test pure logic modules (category grouping, tree-data helpers, the store action) with Vitest; verify the rendered `<Tree>` itself manually via the dev server, matching existing project conventions.
- Every mutator already on `TimelineStore` other than the one being replaced is written as `readonly name = action((...) => {...})`; match that style for the new action.

---

### Task 1: Add antd + dark theme provider

**Files:**
- Modify: `package.json` (via `npm install antd`)
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: the `antd` package available for import anywhere in `src/`; the whole app wrapped in a dark-themed `ConfigProvider`, so any antd component (including the `Tree` added in Task 5) inherits matching colors automatically.

- [ ] **Step 1: Install antd**

Run: `npm install antd`
Expected: `package.json` gains an `"antd": "^6.x.x"` entry (or whatever the current latest is) under `dependencies`.

- [ ] **Step 2: Verify the install**

Run: `npm ls antd`
Expected: prints the installed antd version with no `UNMET DEPENDENCY` error.

- [ ] **Step 3: Wrap the app in a dark-themed ConfigProvider**

Replace the full contents of `src/main.tsx` with:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgContainer: 'hsl(var(--card))',
          colorBgElevated: 'hsl(var(--popover))',
          colorBorder: 'hsl(var(--border))',
          colorText: 'hsl(var(--foreground))',
          colorPrimary: 'hsl(var(--primary))',
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
```

- [ ] **Step 4: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors.

- [ ] **Step 5: Smoke-test in the browser**

Run: `npm run dev:client` (or `npm run dev` if you also want the API server up)
Expected: app loads at the printed localhost URL exactly as before (chart + timeline panels visible), no red errors in the browser console related to antd or `ConfigProvider`. Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/main.tsx
git commit -m "Add antd with a dark ConfigProvider theme"
```

---

### Task 2: Add group metadata to timeline categories

**Files:**
- Modify: `src/components/timeline/categories/index.ts`
- Test: `src/components/timeline/categories/index.test.ts`

**Interfaces:**
- Consumes: nothing new from other tasks (works against the existing `TIMELINE_CATEGORIES` shape).
- Produces:
  - `export type TimelineGroupKey = 'geological' | 'historic' | 'religious' | 'astronomical'`
  - `export type TimelineGroup = { key: TimelineGroupKey; label: string }`
  - `export const TIMELINE_GROUPS: TimelineGroup[]` (order: geological, historic, religious, astronomical)
  - `TimelineCategory` gains a required `group: TimelineGroupKey` field, populated on every entry in `TIMELINE_CATEGORIES`.

- [ ] **Step 1: Write the failing test**

Create `src/components/timeline/categories/index.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { TIMELINE_CATEGORIES, TIMELINE_GROUPS } from './index'

describe('TIMELINE_GROUPS / TIMELINE_CATEGORIES grouping', () => {
  it('every category belongs to a declared group', () => {
    const groupKeys = new Set(TIMELINE_GROUPS.map(g => g.key))
    for (const category of TIMELINE_CATEGORIES) {
      expect(groupKeys.has(category.group)).toBe(true)
    }
  })

  it('every group has at least one category', () => {
    for (const group of TIMELINE_GROUPS) {
      const count = TIMELINE_CATEGORIES.filter(c => c.group === group.key).length
      expect(count).toBeGreaterThan(0)
    }
  })

  it('groups categories per the Geological/Historic/Religious/Astronomical spec', () => {
    const byGroup = (key: string) =>
      TIMELINE_CATEGORIES.filter(c => c.group === key).map(c => c.key)

    expect(byGroup('geological')).toEqual(['eon', 'era', 'geoPeriod'])
    expect(byGroup('historic')).toEqual(['european'])
    expect(byGroup('religious')).toEqual(['yugaTraditional', 'yugaCustom', 'yugaYukteswar'])
    expect(byGroup('astronomical')).toEqual(['precession'])
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/components/timeline/categories/index.test.ts`
Expected: FAIL — `TIMELINE_GROUPS` is not exported yet (or categories have no `.group`, so the assertions fail).

- [ ] **Step 3: Implement the group metadata**

Replace the full contents of `src/components/timeline/categories/index.ts` with:

```ts
import type { TimeBand, BandStyle } from './band'
import { EONS, EON_STYLE } from './eons'
import { GEOLOGICAL_ERAS, ERA_STYLE } from './eras'
import { GEO_PERIODS, GEO_PERIOD_STYLE } from './geoPeriods'
import { EUROPEAN_PERIODS, EUROPEAN_STYLE } from './european'
import { YUGA_TRADITIONAL, YUGA_TRADITIONAL_STYLE, getTraditionalYugaBands } from './yugaTraditional'
import { YUGA_CUSTOM, YUGA_CUSTOM_STYLE, getCustomYugaBands } from './yugaCustom'
import { YUGA_YUKTESWAR, YUGA_YUKTESWAR_STYLE } from './yugaYukteswar'
import { PRECESSION_AGES, PRECESSION_STYLE } from './precession'

export type { TimeBand, BandStyle }

export type TimelineCategoryKey =
  | 'eon'
  | 'era'
  | 'geoPeriod'
  | 'european'
  | 'yugaTraditional'
  | 'yugaCustom'
  | 'yugaYukteswar'
  | 'precession'

export type TimelineGroupKey =
  | 'geological'
  | 'historic'
  | 'religious'
  | 'astronomical'

export type TimelineGroup = {
  key: TimelineGroupKey
  label: string
}

export type TimelineCategory = {
  key: TimelineCategoryKey
  label: string
  group: TimelineGroupKey
  bands: TimeBand[]
  style: BandStyle
  // Optional zoom-dependent override: returns a coarser/finer set of bands
  // for categories whose native resolution can become too small to draw.
  getBands?: (yearPerPx: number) => TimeBand[]
}

export const TIMELINE_GROUPS: TimelineGroup[] = [
  { key: 'geological', label: 'Geological' },
  { key: 'historic', label: 'Historic' },
  { key: 'religious', label: 'Religious' },
  { key: 'astronomical', label: 'Astronomical' },
]

export const TIMELINE_CATEGORIES: TimelineCategory[] = [
  { key: 'eon', label: 'Eon', group: 'geological', bands: EONS, style: EON_STYLE },
  { key: 'era', label: 'Era', group: 'geological', bands: GEOLOGICAL_ERAS, style: ERA_STYLE },
  { key: 'geoPeriod', label: 'Period', group: 'geological', bands: GEO_PERIODS, style: GEO_PERIOD_STYLE },
  { key: 'european', label: 'European', group: 'historic', bands: EUROPEAN_PERIODS, style: EUROPEAN_STYLE },
  { key: 'yugaTraditional', label: 'Yuga · Traditional', group: 'religious', bands: YUGA_TRADITIONAL, style: YUGA_TRADITIONAL_STYLE, getBands: getTraditionalYugaBands },
  { key: 'yugaCustom', label: 'Yuga · Custom', group: 'religious', bands: YUGA_CUSTOM, style: YUGA_CUSTOM_STYLE, getBands: getCustomYugaBands },
  { key: 'yugaYukteswar', label: 'Yuga · Yukteswar', group: 'religious', bands: YUGA_YUKTESWAR, style: YUGA_YUKTESWAR_STYLE },
  { key: 'precession', label: 'Precession', group: 'astronomical', bands: PRECESSION_AGES, style: PRECESSION_STYLE },
]
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run src/components/timeline/categories/index.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/timeline/categories/index.ts src/components/timeline/categories/index.test.ts
git commit -m "Add group metadata to timeline categories"
```

---

### Task 3: Add the period-tree data helper

**Files:**
- Create: `src/components/timeline/periodTree.ts`
- Test: `src/components/timeline/periodTree.test.ts`

**Interfaces:**
- Consumes: `TIMELINE_CATEGORIES`, `TIMELINE_GROUPS`, `TimelineCategoryKey` from `./categories` (Task 2).
- Produces:
  - `export const GROUP_NODE_PREFIX = 'group:'`
  - `export type PeriodTreeNode = { key: string; title: string; children: { key: TimelineCategoryKey; title: string }[] }`
  - `export function buildPeriodTreeData(): PeriodTreeNode[]`
  - `export function toCategoryKeys(checkedKeys: (string | number)[]): TimelineCategoryKey[]`

This module has no antd import — its output is structurally compatible with antd `Tree`'s `treeData`/`onCheck` prop shapes (verified by the type-check step in Task 5), which keeps this module testable in isolation.

- [ ] **Step 1: Write the failing test**

Create `src/components/timeline/periodTree.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { buildPeriodTreeData, toCategoryKeys } from './periodTree'

describe('buildPeriodTreeData', () => {
  it('builds one parent node per group, each with its categories as children', () => {
    const tree = buildPeriodTreeData()

    expect(tree.map(node => node.key)).toEqual([
      'group:geological',
      'group:historic',
      'group:religious',
      'group:astronomical',
    ])

    const geological = tree.find(node => node.key === 'group:geological')!
    expect(geological.children.map(c => c.key)).toEqual(['eon', 'era', 'geoPeriod'])
    expect(geological.children.map(c => c.title)).toEqual(['Eon', 'Era', 'Period'])

    const religious = tree.find(node => node.key === 'group:religious')!
    expect(religious.children.map(c => c.key)).toEqual([
      'yugaTraditional',
      'yugaCustom',
      'yugaYukteswar',
    ])
  })
})

describe('toCategoryKeys', () => {
  it('keeps real category keys and drops synthetic group keys', () => {
    const result = toCategoryKeys(['group:geological', 'eon', 'era', 'geoPeriod'])
    expect(result).toEqual(['eon', 'era', 'geoPeriod'])
  })

  it('returns an empty array when nothing is checked', () => {
    expect(toCategoryKeys([])).toEqual([])
  })

  it('drops unknown keys that are not declared categories', () => {
    expect(toCategoryKeys(['not-a-real-key', 'precession'])).toEqual(['precession'])
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/components/timeline/periodTree.test.ts`
Expected: FAIL — `src/components/timeline/periodTree.ts` does not exist yet (module not found).

- [ ] **Step 3: Implement the helper**

Create `src/components/timeline/periodTree.ts`:

```ts
import { TIMELINE_CATEGORIES, TIMELINE_GROUPS, type TimelineCategoryKey } from './categories'

export const GROUP_NODE_PREFIX = 'group:'

export type PeriodTreeNode = {
  key: string
  title: string
  children: { key: TimelineCategoryKey; title: string }[]
}

export function buildPeriodTreeData(): PeriodTreeNode[] {
  return TIMELINE_GROUPS.map(group => ({
    key: `${GROUP_NODE_PREFIX}${group.key}`,
    title: group.label,
    children: TIMELINE_CATEGORIES
      .filter(category => category.group === group.key)
      .map(category => ({ key: category.key, title: category.label })),
  }))
}

const CATEGORY_KEYS = new Set<string>(TIMELINE_CATEGORIES.map(category => category.key))

export function toCategoryKeys(checkedKeys: (string | number)[]): TimelineCategoryKey[] {
  return checkedKeys.filter(
    (key): key is TimelineCategoryKey => CATEGORY_KEYS.has(String(key)),
  )
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run src/components/timeline/periodTree.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/timeline/periodTree.ts src/components/timeline/periodTree.test.ts
git commit -m "Add period-tree data helper for the grouped Tree view"
```

---

### Task 4: Replace `toggleCategory` with `setVisibleCategories` on the store

**Files:**
- Modify: `src/stores/TimelineStore.ts`
- Test: `src/stores/TimelineStore.test.ts`

**Interfaces:**
- Consumes: `TIMELINE_CATEGORIES`, `TimelineCategoryKey` (already imported in `TimelineStore.ts`).
- Produces: `TimelineStore.setVisibleCategories(keys: TimelineCategoryKey[]): void` — sets every key in `keys` to `true` in `visibleCategories` and every other declared category to `false`. Removes `TimelineStore.toggleCategory`.

- [ ] **Step 1: Write the failing test**

Create `src/stores/TimelineStore.test.ts`:

```ts
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { TimelineStore } from './TimelineStore'
import type { RootStore } from './RootStore'

function createStore() {
  return new TimelineStore({} as RootStore)
}

describe('TimelineStore.setVisibleCategories', () => {
  it('defaults to only yugaCustom visible', () => {
    const store = createStore()
    expect(store.visibleCategories.yugaCustom).toBe(true)
    expect(store.visibleCategories.eon).toBe(false)
  })

  it('sets given keys visible and clears all others', () => {
    const store = createStore()
    store.setVisibleCategories(['eon', 'era', 'geoPeriod'])

    expect(store.visibleCategories.eon).toBe(true)
    expect(store.visibleCategories.era).toBe(true)
    expect(store.visibleCategories.geoPeriod).toBe(true)
    expect(store.visibleCategories.yugaCustom).toBe(false)
    expect(store.visibleCategories.european).toBe(false)
  })

  it('clears all categories when given an empty array', () => {
    const store = createStore()
    store.setVisibleCategories([])

    for (const value of Object.values(store.visibleCategories)) {
      expect(value).toBe(false)
    }
  })
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/stores/TimelineStore.test.ts`
Expected: FAIL — `store.setVisibleCategories is not a function`.

- [ ] **Step 3: Implement the action**

In `src/stores/TimelineStore.ts`, replace:

```ts
  toggleCategory(key: TimelineCategoryKey) {
    this.visibleCategories[key] = !this.visibleCategories[key]
  }
```

with:

```ts
  readonly setVisibleCategories = action((keys: TimelineCategoryKey[]) => {
    const visible = new Set(keys)
    for (const category of TIMELINE_CATEGORIES) {
      this.visibleCategories[category.key] = visible.has(category.key)
    }
  });
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run src/stores/TimelineStore.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/stores/TimelineStore.ts src/stores/TimelineStore.test.ts
git commit -m "Replace TimelineStore.toggleCategory with setVisibleCategories"
```

---

### Task 5: Rewrite ViewSelection as a checkable antd Tree

**Files:**
- Modify: `src/components/timeline/ViewSelection.tsx`

**Interfaces:**
- Consumes: `buildPeriodTreeData`, `toCategoryKeys` from `./periodTree` (Task 3); `store.setVisibleCategories`, `store.visibleCategories` from `TimelineStore` (Task 4); `TIMELINE_CATEGORIES` from `./categories` (Task 2); `antd`'s `Tree` + dark theme from `ConfigProvider` (Task 1).
- Produces: the same `export const ViewSelection` component, same props (none) — `InfiniteTimeline.tsx`'s `import { ViewSelection } from './timeline/ViewSelection'` and `<ViewSelection />` usage need no changes.

This task has no automated test (no component-test infra exists in this repo — see Global Constraints). Verification is manual, via the dev server, against the checklist in Step 3.

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `src/components/timeline/ViewSelection.tsx` with:

```tsx
import { observer } from 'mobx-react-lite'
import { Tree } from 'antd'
import { useTimelineStore } from '../../stores/StoreContext'
import { TIMELINE_CATEGORIES } from './categories'
import { buildPeriodTreeData, toCategoryKeys } from './periodTree'

const TREE_DATA = buildPeriodTreeData()

export const ViewSelection = observer(function ViewSelection() {
  const store = useTimelineStore()

  const checkedKeys = TIMELINE_CATEGORIES
    .filter(category => store.visibleCategories[category.key])
    .map(category => category.key)

  return (
    <div
      className="absolute top-3 left-3 z-10 bg-slate-900/80 border border-slate-700/60 rounded-md px-3 py-2 backdrop-blur-sm pointer-events-auto"
      onMouseDown={e => e.stopPropagation()}
      onMouseUp={e => e.stopPropagation()}
    >
      <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1.5">View</p>
      <Tree
        checkable
        defaultExpandAll
        checkedKeys={checkedKeys}
        onCheck={checkedKeysValue => {
          const keys = Array.isArray(checkedKeysValue) ? checkedKeysValue : checkedKeysValue.checked
          store.setVisibleCategories(toCategoryKeys(keys))
        }}
        treeData={TREE_DATA}
        style={{ fontSize: 10, background: 'transparent' }}
      />
    </div>
  )
})
```

- [ ] **Step 2: Type-check**

Run: `npx tsc -p tsconfig.app.json --noEmit`
Expected: no errors. If `treeData`/`checkedKeys`/`onCheck` report a type mismatch against antd's `Tree` props, adjust `PeriodTreeNode` in `src/components/timeline/periodTree.ts` (Task 3) to match antd's expected `title`/`children` field types rather than casting with `as` in this file.

- [ ] **Step 3: Manual verification in the browser**

Run: `npm run dev`
Open the printed localhost URL and confirm, on the timeline panel's "View" tree in the top-left corner:

1. The tree renders 4 groups — Geological, Historic, Religious, Astronomical — each expanded by default, with the correct children (Geological: Eon/Era/Period; Historic: European; Religious: Yuga · Traditional/Yuga · Custom/Yuga · Yukteswar; Astronomical: Precession).
2. On load, only "Yuga · Custom" is checked, and "Religious" renders half-checked (indeterminate); only Yuga · Custom's bands are drawn on the canvas below.
3. Checking "Geological" checks Eon, Era, and Period together and draws all three bands; unchecking "Geological" clears all three.
4. Checking a single leaf (e.g. "Precession") checks only that leaf, flips "Astronomical" to fully checked (single-child group), and draws its bands; unchecking it removes them and returns the group to unchecked.
5. No errors in the browser console.

- [ ] **Step 4: Commit**

```bash
git add src/components/timeline/ViewSelection.tsx
git commit -m "Rewrite ViewSelection as a grouped, checkable antd Tree"
```
