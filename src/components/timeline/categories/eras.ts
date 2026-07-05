import type { TimeBand, BandStyle } from './band'

// Source: https://en.wikipedia.org/wiki/List_of_time_periods
export const GEOLOGICAL_ERAS: TimeBand[] = [
  { start: -541_000_000, end: -252_000_000, label: 'Paleozoic', color: '#1d4ed8' },
  { start: -252_000_000, end: -66_000_000, label: 'Mesozoic', color: '#15803d' },
  { start: -66_000_000, end: null, label: 'Cenozoic', color: '#b45309' },
]

export const ERA_STYLE: BandStyle = { alpha: 0.16, labelAlpha: 0.30, labelY: 22, fontSize: 9 }
