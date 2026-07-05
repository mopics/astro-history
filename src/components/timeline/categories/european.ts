import type { TimeBand, BandStyle } from './band'

export const EUROPEAN_PERIODS: TimeBand[] = [
  { start: -3000, end: -1050, label: 'Bronze Age Europe', color: '#f97316' },
  { start: -1050, end: 500, label: 'Iron Age Europe', color: '#f59e0b' },
  { start: 476, end: 1492, label: 'Middle Ages Europe', color: '#d97706' },
  { start: 1492, end: 1789, label: 'Early Modern Europe', color: '#b45309' },
]

export const EUROPEAN_STYLE: BandStyle = { alpha: 0.24, labelAlpha: 0.40, labelY: 42, fontSize: 8 }
