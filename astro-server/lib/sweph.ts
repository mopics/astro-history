// @ts-ignore
import * as sweph from 'sweph'
import { longitudeToZodiac, isRetrograde } from './astroUtils'

// sweph v2 exposes constants under sweph.constants and functions directly on sweph
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sw = sweph as any
const c = sw.constants

sw.set_ephe_path('./astro-server/ephe/')

export type ChartBody = {
  name: string
  longitude: number
  sign: string
  signDegree: number
  retrograde: boolean
}

type BodyDef = { name: string; id: number }

const BODIES: BodyDef[] = [
  { name: 'Sun', id: c.SE_SUN },
  { name: 'Moon', id: c.SE_MOON },
  { name: 'Mercury', id: c.SE_MERCURY },
  { name: 'Venus', id: c.SE_VENUS },
  { name: 'Mars', id: c.SE_MARS },
  { name: 'Jupiter', id: c.SE_JUPITER },
  { name: 'Saturn', id: c.SE_SATURN },
  { name: 'Uranus', id: c.SE_URANUS },
  { name: 'Neptune', id: c.SE_NEPTUNE },
  { name: 'Pluto', id: c.SE_PLUTO },
  { name: 'North Node', id: c.SE_MEAN_NODE },
]

const FLAGS = c.SEFLG_SWIEPH | c.SEFLG_SPEED

export function dateToJulian(day: number, month: number, year: number, time: number): number {
  return sw.julday(year, month, day, time, c.SE_GREG_CAL)
}

export function computeChart(julianDate: number, _lat: number, _lon: number): ChartBody[] {
  const results: ChartBody[] = []

  for (const body of BODIES) {
    // calc_ut returns { flag: number, error: string, data: [lon, lat, dist, lonSpd, latSpd, distSpd] }
    const calc = sw.calc_ut(julianDate, body.id, FLAGS)
    if (calc.flag < 0) throw new Error(`sweph error for ${body.name}: ${calc.error}`)
    const longitude = calc.data[0]
    const { sign, signDegree } = longitudeToZodiac(longitude)
    results.push({
      name: body.name,
      longitude,
      sign,
      signDegree,
      retrograde: isRetrograde(calc.data[3]),
    })
  }

  // South Node is directly opposite the North Node
  const northNode = results.find(b => b.name === 'North Node')!
  const southLon = (northNode.longitude + 180) % 360
  const { sign, signDegree } = longitudeToZodiac(southLon)
  results.push({
    name: 'South Node',
    longitude: southLon,
    sign,
    signDegree,
    retrograde: false,
  })

  return results
}
