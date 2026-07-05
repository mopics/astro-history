import type { TimeBand, BandStyle } from './band'
import { EONS, EON_STYLE } from './eons'
import { GEOLOGICAL_ERAS, ERA_STYLE } from './eras'
import { GEO_PERIODS, GEO_PERIOD_STYLE } from './geoPeriods'
import { EUROPEAN_PERIODS, EUROPEAN_STYLE } from './european'
import { YUGA_TRADITIONAL, YUGA_TRADITIONAL_STYLE, getTraditionalYugaBands } from './yugaTraditional'
import { YUGA_YUKTESWAR, YUGA_YUKTESWAR_STYLE } from './yugaYukteswar'
import { PRECESSION_AGES, PRECESSION_STYLE } from './precession'

export type { TimeBand, BandStyle }

export type TimelineCategoryKey =
  | 'eon'
  | 'era'
  | 'geoPeriod'
  | 'european'
  | 'yugaTraditional'
  | 'yugaYukteswar'
  | 'precession'

export type TimelineCategory = {
  key: TimelineCategoryKey
  label: string
  bands: TimeBand[]
  style: BandStyle
  // Optional zoom-dependent override: returns a coarser/finer set of bands
  // for categories whose native resolution can become too small to draw.
  getBands?: (yearPerPx: number) => TimeBand[]
}

export const TIMELINE_CATEGORIES: TimelineCategory[] = [
  { key: 'eon', label: 'Eon', bands: EONS, style: EON_STYLE },
  { key: 'era', label: 'Era', bands: GEOLOGICAL_ERAS, style: ERA_STYLE },
  { key: 'geoPeriod', label: 'Period', bands: GEO_PERIODS, style: GEO_PERIOD_STYLE },
  { key: 'european', label: 'European', bands: EUROPEAN_PERIODS, style: EUROPEAN_STYLE },
  { key: 'yugaTraditional', label: 'Yuga · Traditional', bands: YUGA_TRADITIONAL, style: YUGA_TRADITIONAL_STYLE, getBands: getTraditionalYugaBands },
  { key: 'yugaYukteswar', label: 'Yuga · Yukteswar', bands: YUGA_YUKTESWAR, style: YUGA_YUKTESWAR_STYLE },
  { key: 'precession', label: 'Precession', bands: PRECESSION_AGES, style: PRECESSION_STYLE },
]
