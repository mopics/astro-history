import type { TimeBand, BandStyle } from './band'
import { EONS, EON_STYLE } from './eons'
import { GEOLOGICAL_ERAS, ERA_STYLE } from './eras'
import { GEO_PERIODS, GEO_PERIOD_STYLE } from './geoPeriods'
import { EUROPEAN_PERIODS, EUROPEAN_STYLE } from './european'
import { YUGA_TRADITIONAL, YUGA_TRADITIONAL_STYLE, getTraditionalYugaBands } from './yugaTraditional'
import { YUGA_CUSTOM, YUGA_CUSTOM_STYLE, getCustomYugaBands } from './yugaCustom'
import { YUGA_YUKTESWAR, YUGA_YUKTESWAR_STYLE } from './yugaYukteswar'
import { PRECESSION_AGES, PRECESSION_STYLE } from './precession'

export type { TimeBand, BandStyle }

export type TimelineCategoryKey =
  | 'eon'
  | 'era'
  | 'geoPeriod'
  | 'european'
  | 'yugaTraditional'
  | 'yugaCustom'
  | 'yugaYukteswar'
  | 'precession'

export type TimelineGroupKey =
  | 'geological'
  | 'historic'
  | 'religious'
  | 'astronomical'

export type TimelineGroup = {
  key: TimelineGroupKey
  label: string
}

export type TimelineCategory = {
  key: TimelineCategoryKey
  label: string
  group: TimelineGroupKey
  bands: TimeBand[]
  style: BandStyle
  // Optional zoom-dependent override: returns a coarser/finer set of bands
  // for categories whose native resolution can become too small to draw.
  getBands?: (yearPerPx: number) => TimeBand[]
}

export const TIMELINE_GROUPS: TimelineGroup[] = [
  { key: 'geological', label: 'Geological' },
  { key: 'historic', label: 'Historic' },
  { key: 'religious', label: 'Religious' },
  { key: 'astronomical', label: 'Astronomical' },
]

export const TIMELINE_CATEGORIES: TimelineCategory[] = [
  { key: 'eon', label: 'Eon', group: 'geological', bands: EONS, style: EON_STYLE },
  { key: 'era', label: 'Era', group: 'geological', bands: GEOLOGICAL_ERAS, style: ERA_STYLE },
  { key: 'geoPeriod', label: 'Period', group: 'geological', bands: GEO_PERIODS, style: GEO_PERIOD_STYLE },
  { key: 'european', label: 'European', group: 'historic', bands: EUROPEAN_PERIODS, style: EUROPEAN_STYLE },
  { key: 'yugaTraditional', label: 'Yuga · Traditional', group: 'religious', bands: YUGA_TRADITIONAL, style: YUGA_TRADITIONAL_STYLE, getBands: getTraditionalYugaBands },
  { key: 'yugaCustom', label: 'Yuga · Custom', group: 'religious', bands: YUGA_CUSTOM, style: YUGA_CUSTOM_STYLE, getBands: getCustomYugaBands },
  { key: 'yugaYukteswar', label: 'Yuga · Yukteswar', group: 'religious', bands: YUGA_YUKTESWAR, style: YUGA_YUKTESWAR_STYLE },
  { key: 'precession', label: 'Precession', group: 'astronomical', bands: PRECESSION_AGES, style: PRECESSION_STYLE },
]
