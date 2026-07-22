import { makeAutoObservable, action, runInAction } from 'mobx'
import type { RootStore } from './RootStore'
import { TIMELINE_CATEGORIES, type TimelineCategoryKey } from '../components/timeline/categories'
import { BIG_BANG_YEAR } from '../lib/time'

const NOW_YEAR = new Date().getFullYear()
const TOTAL_SPAN = NOW_YEAR - BIG_BANG_YEAR

export type TimelineEvent = {
  uid: string
  day: number
  month: number
  year: number
  time: number
  lat: number
  lon: number
  name: string
  description: string
  tags: string[]
}

export class TimelineStore {
  viewCenterYear: number = BIG_BANG_YEAR + TOTAL_SPAN * 0.5
  yearPerPx: number = TOTAL_SPAN / 1000
  canvasWidth: number = 1000
  events: TimelineEvent[] = []

  constructor(_root: RootStore) {
    makeAutoObservable(this)
    void this.fetchEvents()
  }

  get bigBangYear() { return BIG_BANG_YEAR }
  get nowYear() { return NOW_YEAR }
  get totalSpan() { return TOTAL_SPAN }

  async fetchEvents() {
    try {
      const res = await fetch('http://localhost:3002/api/listTimelineEvents')
      const data = await res.json() as { events?: TimelineEvent[] }
      runInAction(() => { this.events = data.events ?? [] })
    } catch {
      // server may not be running yet — silently ignore
    }
  }

  yearToPixel(year: number, canvasWidth: number): number {
    return canvasWidth / 2 + (year - this.viewCenterYear) / this.yearPerPx
  }

  pixelToYear(px: number, canvasWidth: number): number {
    return this.viewCenterYear + (px - canvasWidth / 2) * this.yearPerPx
  }

  readonly panTo = action((centerYear: number) => {
    this.viewCenterYear = centerYear
  })

  readonly zoomAt = action((factor: number, anchorPx: number, canvasWidth: number) => {
    const anchorYear = this.pixelToYear(anchorPx, canvasWidth)
    this.yearPerPx = Math.max(
      0.0001,
      Math.min(TOTAL_SPAN / 4, this.yearPerPx * factor),
    )
    this.viewCenterYear = anchorYear - (anchorPx - canvasWidth / 2) * this.yearPerPx
  });

  readonly setCanvasWidth = action((width: number) => {
    this.canvasWidth = width
  });

  // Zoom so that [startYear, endYear] exactly fills the current canvas width.
  readonly zoomToRange = action((startYear: number, endYear: number) => {
    const lo = Math.min(startYear, endYear)
    const hi = Math.max(startYear, endYear)
    const span = Math.max(hi - lo, 1e-6)
    this.viewCenterYear = (lo + hi) / 2
    this.yearPerPx = Math.max(0.0001, Math.min(TOTAL_SPAN / 4, span / this.canvasWidth))
  });

  // GUI
  visibleCategories: Record<TimelineCategoryKey, boolean> = Object.fromEntries(
    TIMELINE_CATEGORIES.map(c => {
      if (c.key == 'yugaCustom')
        return [c.key, true];
      return [c.key, false];
    }),
  ) as Record<TimelineCategoryKey, boolean>

  readonly setVisibleCategories = action((keys: TimelineCategoryKey[]) => {
    const visible = new Set(keys)
    for (const category of TIMELINE_CATEGORIES) {
      this.visibleCategories[category.key] = visible.has(category.key)
    }
  });
}
