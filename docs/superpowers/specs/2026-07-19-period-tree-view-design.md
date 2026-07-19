# Period View as a grouped antd Tree

## Context

The timeline's period overlays (geological eons, historic eras, religious
yuga cycles, astronomical precession ages) are currently selected via a flat
list of checkboxes in [ViewSelection.tsx](../../../src/components/timeline/ViewSelection.tsx),
one per entry in `TIMELINE_CATEGORIES`. As more categories are added (e.g.
future Historic civilizations beyond European), a flat list stops scaling.

This change reorganizes the period selector into a checkable tree, grouped
by domain:

- **Geological**: Eon, Era, Period
- **Historic**: European *(more civilizations, e.g. Egypt, added later — out of scope here)*
- **Religious**: Yuga · Traditional, Yuga · Custom, Yuga · Yukteswar
- **Astronomical**: Precession

## Non-goals

- No new period/category data (e.g. Egypt) is added — only the four group
  headings above and the existing 8 leaf categories are wired up.
- No change to canvas rendering logic in `InfiniteTimeline.tsx` beyond it
  continuing to read `store.visibleCategories` exactly as before.

## Data model

`src/components/timeline/categories/index.ts`:

- Add `export type TimelineGroupKey = 'geological' | 'historic' | 'religious' | 'astronomical'`.
- Add `group: TimelineGroupKey` to the `TimelineCategory` type, and set it on
  every entry in `TIMELINE_CATEGORIES` per the grouping above.
- Add `export const TIMELINE_GROUPS: { key: TimelineGroupKey; label: string }[]`
  listing the four groups in display order (Geological, Historic, Religious,
  Astronomical).
- `TIMELINE_CATEGORIES` remains a flat array — existing consumers that don't
  care about grouping (`InfiniteTimeline.tsx`'s `drawPeriods`) are unaffected.

## Store

`src/stores/TimelineStore.ts`:

- Keep `visibleCategories: Record<TimelineCategoryKey, boolean>` as the
  single source of truth for what's rendered — no change to its shape or
  default values (only `yugaCustom` starts `true`).
- Remove `toggleCategory(key)`.
- Add `setVisibleCategories(keys: TimelineCategoryKey[])`, an action that
  sets every key in the array to `true` and every other `TimelineCategoryKey`
  to `false`. This matches antd `Tree`'s `onCheck` callback shape, which
  reports the full current checked-set rather than a single toggled key.
- `toggleCategory` has exactly one caller today (`ViewSelection.tsx`), which
  is being rewritten in this change, so removing it is safe.

## UI

**Dependency**: add `antd` (v5) to `package.json`.

**Theming** (`src/main.tsx`): wrap the app in antd's `<ConfigProvider>` using
`theme.darkAlgorithm`, with token overrides pulled from the slate palette
already used throughout the app (`colorBgContainer`, `colorBgElevated`,
`colorBorder`, `colorText`, `colorPrimary`) so the Tree — and any antd
component added later — visually matches the existing dark UI rather than
antd's defaults.

**`src/components/timeline/ViewSelection.tsx`**: replace the `<ul>` of
checkboxes with antd's `<Tree checkable />`, inside the same positioned
wrapper div (`absolute top-3 left-3 z-10 bg-slate-900/80 …`) so on-screen
placement is unchanged.

- `treeData`: built by grouping `TIMELINE_CATEGORIES` under `TIMELINE_GROUPS`
  — 4 parent nodes (group keys prefixed, e.g. `group:geological`, to avoid
  any collision with leaf `TimelineCategoryKey` values), each with its
  categories as leaf children.
- `checkedKeys`: derived each render from `store.visibleCategories` — the
  list of leaf category keys currently `true`.
- `onCheck(checkedKeysValue)`: antd returns the full new checked-set,
  including synthetic group keys when all of a group's children are checked
  (its "conduction" behavior). Filter that array down to valid
  `TimelineCategoryKey` values (drop the `group:*` keys) and call
  `store.setVisibleCategories(...)` with the result.
- Checking/unchecking a group cascades to all its children; a group with
  only some children checked renders half-checked (indeterminate). This is
  antd `Tree`'s built-in default behavior (`checkStrictly` left `false`) —
  no manual cascade logic needed.
- `defaultExpandAll`: all 4 groups start expanded (9 leaves total, small
  enough to show fully without interaction).
- Compact styling (small font, tight spacing) to match the current
  `text-[10px]` density of the rest of the overlay panel.

## Verification

Manual, via `npm run dev`:

1. Tree renders the 4 groups with correct children, all expanded by default.
2. On load, only "Yuga · Custom" is checked and its group ("Religious")
   renders half-checked; the corresponding bands are the only ones drawn on
   the canvas.
3. Checking a group (e.g. "Geological") checks all its children and draws
   all their bands; unchecking it clears all of them.
4. Checking/unchecking a single leaf updates only that leaf's bands and
   correctly flips its group between checked / half-checked / unchecked.
5. No console errors from antd (e.g. missing `key` warnings, theme
   provider issues).

No automated tests exist for this UI today (`ViewSelection` had none); this
change doesn't introduce a testing gap beyond what already existed.
