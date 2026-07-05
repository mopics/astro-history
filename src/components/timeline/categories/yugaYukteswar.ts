import type { TimeBand, BandStyle } from './band'

// Sri Yukteswar's short chronology: a 24,000-year descending + ascending
// cycle (tied to the precession of the equinoxes), anchored to the ascending
// Kali Yuga's start, 499 CE.
export const YUGA_YUKTESWAR: TimeBand[] = [
  { start: -11_501, end: -6_701, label: 'Satya Yuga (desc.)', color: '#fde68a' },
  { start: -6_701, end: -3_101, label: 'Treta Yuga (desc.)', color: '#cbd5e1' },
  { start: -3_101, end: -701, label: 'Dwapara Yuga (desc.)', color: '#fb923c' },
  { start: -701, end: 499, label: 'Kali Yuga (desc.)', color: '#b91c1c' },
  { start: 499, end: 1699, label: 'Kali Yuga (asc.)', color: '#b91c1c' },
  { start: 1699, end: 4099, label: 'Dwapara Yuga (asc.)', color: '#fb923c' },
  { start: 4099, end: 7699, label: 'Treta Yuga (asc.)', color: '#cbd5e1' },
  { start: 7699, end: 12_499, label: 'Satya Yuga (asc.)', color: '#fde68a' },
]

export const YUGA_YUKTESWAR_STYLE: BandStyle = { alpha: 0.24, labelAlpha: 0.40, labelY: 62, fontSize: 8 }
