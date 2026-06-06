import { makeAutoObservable, runInAction, reaction } from 'mobx'
import type { RootStore } from './RootStore'

export type ChartBody = {
  name: string
  longitude: number
  sign: string
  signDegree: number
  retrograde: boolean
}

const DEBOUNCE_MS = 600
const MAX_WAIT_MS = 2_000

export class AstroChartStore {
  day = 5
  month = 3
  year = 1974
  time = 12
  lat = 5
  lon = 4
  bodies: ChartBody[] = []
  loading = false
  error: string | null = null

  constructor(_root: RootStore) {
    makeAutoObservable(this)
    this.#startAutoFetch()
  }

  get decimalYear(): number {
    return this.year + (this.month - 1) / 12 + (this.day - 1) / 365.25
  }

  setDay(v: number) { this.day = v }
  setMonth(v: number) { this.month = v }
  setYear(v: number) { this.year = v }
  setTime(v: number) { this.time = v }
  setLat(v: number) { this.lat = v }
  setLon(v: number) { this.lon = v }

  async fetchChart() {
    this.loading = true
    this.error = null
    const params = new URLSearchParams({
      day: String(this.day),
      month: String(this.month),
      year: String(this.year),
      time: String(this.time),
      lat: String(this.lat),
      lon: String(this.lon),
    })
    try {
      const res = await fetch(`http://localhost:3002/api/getAstroChart?${params}`)
      const data = await res.json() as { bodies?: ChartBody[]; error?: string }
      runInAction(() => {
        if (data.error) {
          this.error = data.error
        } else {
          this.bodies = data.bodies ?? []
        }
        this.loading = false
      })
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to fetch'
        this.loading = false
      })
    }
  }

  // Capped debounce: fires after DEBOUNCE_MS of inactivity,
  // but no later than MAX_WAIT_MS after the first change in a burst.
  #startAutoFetch() {
    let debounce: ReturnType<typeof setTimeout> | null = null
    let cap:      ReturnType<typeof setTimeout> | null = null

    const fire = () => {
      if (debounce) { clearTimeout(debounce); debounce = null }
      if (cap)      { clearTimeout(cap);      cap      = null }
      void this.fetchChart()
    }

    reaction(
      () => [this.day, this.month, this.year, this.time, this.lat, this.lon],
      () => {
        if (debounce) clearTimeout(debounce)
        debounce = setTimeout(fire, DEBOUNCE_MS)
        if (!cap) cap = setTimeout(fire, MAX_WAIT_MS)
      },
    )
  }
}
