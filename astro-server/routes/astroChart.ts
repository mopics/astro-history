import { Hono } from 'hono'
import { computeChart, dateToJulian } from '../lib/sweph'

export const astroChartRoutes = new Hono()

astroChartRoutes.get('/getAstroChart', (c) => {
  const dayStr  = c.req.query('day')
  const monStr  = c.req.query('month')
  const yearStr = c.req.query('year')
  const timeStr = c.req.query('time')
  const latStr  = c.req.query('lat')
  const lonStr  = c.req.query('lon')

  if (!dayStr || !monStr || !yearStr || !timeStr || !latStr || !lonStr) {
    return c.json({ error: 'day, month, year, time, lat, and lon are required' }, 400)
  }

  const day  = Number(dayStr)
  const month = Number(monStr)
  const year = Number(yearStr)
  const time = Number(timeStr)
  const lat  = Number(latStr)
  const lon  = Number(lonStr)

  if ([day, month, year, time, lat, lon].some(isNaN)) {
    return c.json({ error: 'day, month, year, time, lat, and lon must be numbers' }, 400)
  }
  if (month < 1 || month > 12) {
    return c.json({ error: 'month must be between 1 and 12' }, 400)
  }
  if (day < 1 || day > 31) {
    return c.json({ error: 'day must be between 1 and 31' }, 400)
  }
  if (time < 0 || time >= 24) {
    return c.json({ error: 'time must be a decimal hour between 0 and 24' }, 400)
  }
  if (lat < -90 || lat > 90) {
    return c.json({ error: 'lat must be between -90 and 90' }, 400)
  }
  if (lon < -180 || lon > 180) {
    return c.json({ error: 'lon must be between -180 and 180' }, 400)
  }

  try {
    const julianDate = dateToJulian(day, month, year, time)
    const bodies = computeChart(julianDate, lat, lon)
    return c.json({ bodies })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return c.json({ error: message }, 500)
  }
})
