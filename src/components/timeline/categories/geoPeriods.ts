import type { TimeBand, BandStyle } from './band'

// Source: https://en.wikipedia.org/wiki/List_of_time_periods
export const GEO_PERIODS: TimeBand[] = [
  { start: -541_000_000, end: -485_400_000, label: 'Cambrian', color: '#2563eb' },
  { start: -485_400_000, end: -443_800_000, label: 'Ordovician', color: '#0284c7' },
  { start: -443_800_000, end: -419_200_000, label: 'Silurian', color: '#0891b2' },
  { start: -419_200_000, end: -358_900_000, label: 'Devonian', color: '#0d9488' },
  { start: -358_900_000, end: -298_900_000, label: 'Carboniferous', color: '#059669' },
  { start: -298_900_000, end: -251_900_000, label: 'Permian', color: '#92400e' },
  { start: -251_900_000, end: -201_300_000, label: 'Triassic', color: '#c2410c' },
  { start: -201_300_000, end: -145_000_000, label: 'Jurassic', color: '#166534' },
  { start: -145_000_000, end: -66_000_000, label: 'Cretaceous', color: '#15803d' },
  { start: -66_000_000, end: -23_030_000, label: 'Paleogene', color: '#a16207' },
  { start: -23_030_000, end: -2_580_000, label: 'Neogene', color: '#b45309' },
  { start: -2_580_000, end: null, label: 'Quaternary', color: '#d97706' },
]

export const GEO_PERIOD_STYLE: BandStyle = { alpha: 0.20, labelAlpha: 0.35, labelY: 32, fontSize: 8 }
