import type { TimeBand, BandStyle } from './band'
import { BIG_BANG_YEAR } from '../../../lib/time'

// Traditional long chronology (Surya Siddhanta, 4:3:2:1 ratio): a Mahayuga is
// 4,320,000 years of Satya → Treta → Dwapara → Kali. The current cycle's Kali
// Yuga traditionally began 3102 BCE; walking backward, the same four yugas
// repeat every 4,320,000 years all the way to the Big Bang.
const TRADITIONAL_KALI_START = -3_102
const YUGAS_DESCENDING = [
  { label: 'Kali Yuga', duration: 432_000, color: '#7f1d1d' },
  { label: 'Dwapara Yuga', duration: 864_000, color: '#ea580c' },
  { label: 'Treta Yuga', duration: 1_296_000, color: '#94a3b8' },
  { label: 'Satya Yuga', duration: 1_728_000, color: '#facc15' },
]

const CURRENT_CYCLE_END = TRADITIONAL_KALI_START + 432_000 // far-future end of the current, ongoing Kali Yuga
const MAHAYUGA_LENGTH = YUGAS_DESCENDING.reduce((sum, y) => sum + y.duration, 0) // 4,320,000
const SHORTEST_YUGA = Math.min(...YUGAS_DESCENDING.map(y => y.duration)) // Kali, 432,000

function generateCycles(): TimeBand[] {
  const out: TimeBand[] = []
  let end = CURRENT_CYCLE_END
  let i = 0
  while (end > BIG_BANG_YEAR) {
    const yuga = YUGAS_DESCENDING[i % YUGAS_DESCENDING.length]
    const start = Math.max(end - yuga.duration, BIG_BANG_YEAR)
    out.push({ start, end, label: yuga.label, color: yuga.color })
    end = start
    i++
  }
  return out
}

export const YUGA_TRADITIONAL: TimeBand[] = generateCycles()

export const YUGA_TRADITIONAL_STYLE: BandStyle = { alpha: 0.14, labelAlpha: 0.28, labelY: 52, fontSize: 9 }

// Level of detail: once individual yugas would draw narrower than this many
// px, roll them up into whole Mahayuga cycles, then 4 cycles per band, then
// 16, 64, ... (×4 each step) — so the cyclical structure stays visible
// however far out you zoom, instead of the bands just vanishing.
const MIN_BAND_PX = 6
const AGGREGATE_COLOR = '#7c3aed'

function generateCycleGroups(cyclesPerBand: number): TimeBand[] {
  const bandLength = cyclesPerBand * MAHAYUGA_LENGTH
  const label = cyclesPerBand === 1 ? 'Mahayuga' : `${cyclesPerBand} Mahayugas`
  const out: TimeBand[] = []
  let end = CURRENT_CYCLE_END
  while (end > BIG_BANG_YEAR) {
    const start = Math.max(end - bandLength, BIG_BANG_YEAR)
    out.push({ start, end, label, color: AGGREGATE_COLOR })
    end = start
  }
  return out
}

export function getTraditionalYugaBands(yearPerPx: number): TimeBand[] {
  if (SHORTEST_YUGA / yearPerPx >= MIN_BAND_PX) return YUGA_TRADITIONAL

  let cyclesPerBand = 1
  while ((cyclesPerBand * MAHAYUGA_LENGTH) / yearPerPx < MIN_BAND_PX) {
    cyclesPerBand *= 4
  }
  return generateCycleGroups(cyclesPerBand)
}
