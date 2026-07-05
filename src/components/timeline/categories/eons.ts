import type { TimeBand, BandStyle } from './band'

// Source: https://en.wikipedia.org/wiki/List_of_time_periods
export const EONS: TimeBand[] = [
  { start: -4_600_000_000, end: -4_000_000_000, label: 'Hadean', color: '#6b21a8' },
  { start: -4_000_000_000, end: -2_500_000_000, label: 'Archean', color: '#9f1239' },
  { start: -2_500_000_000, end: -541_000_000, label: 'Proterozoic', color: '#0e4c7a' },
]

export const EON_STYLE: BandStyle = { alpha: 0.12, labelAlpha: 0.25, labelY: 12, fontSize: 10 }
