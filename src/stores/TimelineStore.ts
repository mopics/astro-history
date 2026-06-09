import { makeAutoObservable, action, runInAction } from 'mobx'
import type { RootStore } from './RootStore'

const BIG_BANG_YEAR = -13_800_000_000
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

  // GUI
  selectedPeriodTags: Record<string, boolean> = {}
  setSelectedPeriodTags(tags: Record<string, boolean>) {
    this.selectedPeriodTags = tags
  }
}
