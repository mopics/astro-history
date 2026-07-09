import type { TimeBand, BandStyle } from './band'
import { BIG_BANG_YEAR } from '../../../lib/time'

// Adjustable variant of the traditional yuga cycle: same descending order and
// 4:3:2:1 (Satya:Treta:Dwapara:Kali) length ratio, but the base unit length
// and the anchor point are exposed here so the whole cycle can be rescaled or
// rephased without touching the generation logic below.

// Length of one Kali Yuga, in years. The other three yugas are this × 2, × 3,
// and × 4 respectively, preserving the traditional ratio.
const KALI_YUGA_LENGTH = 432_000 * 1680

// Year the current (ongoing) Kali Yuga began. Negative = BCE. Shifting this
// slides the entire cycle (and all earlier repeats of it) forward or back.
const CUSTOM_KALI_START = -3_102

const RATIOS_DESCENDING = [
  { label: 'Kali Yuga', ratio: 1, color: '#7f1d1d' },
  { label: 'Dwapara Yuga', ratio: 2, color: '#ea580c' },
  { label: 'Treta Yuga', ratio: 3, color: '#94a3b8' },
  { label: 'Satya Yuga', ratio: 4, color: '#facc15' },
]
const YUGAS_DESCENDING = RATIOS_DESCENDING.map(y => ({ ...y, duration: y.ratio * KALI_YUGA_LENGTH }))

const CURRENT_CYCLE_END = CUSTOM_KALI_START + KALI_YUGA_LENGTH // far-future end of the current, ongoing Kali Yuga
const MAHAYUGA_LENGTH = YUGAS_DESCENDING.reduce((sum, y) => sum + y.duration, 0)
const SHORTEST_YUGA = Math.min(...YUGAS_DESCENDING.map(y => y.duration)) // Kali

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

export const YUGA_CUSTOM: TimeBand[] = generateCycles()

export const YUGA_CUSTOM_STYLE: BandStyle = { alpha: 0.14, labelAlpha: 0.28, labelY: 52, fontSize: 9 }

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

export function getCustomYugaBands(yearPerPx: number): TimeBand[] {
  if (SHORTEST_YUGA / yearPerPx >= MIN_BAND_PX) return YUGA_CUSTOM

  let cyclesPerBand = 1
  while ((cyclesPerBand * MAHAYUGA_LENGTH) / yearPerPx < MIN_BAND_PX) {
    cyclesPerBand *= 4
  }
  return generateCycleGroups(cyclesPerBand)
}
