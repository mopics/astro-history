// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('../lib/sweph', () => ({
  computeChart: vi.fn(),
  dateToJulian: vi.fn().mockReturnValue(2451545.0),
}))

import { computeChart, dateToJulian } from '../lib/sweph'
import { astroChartRoutes } from './astroChart'

const mockComputeChart = vi.mocked(computeChart)
const mockDateToJulian = vi.mocked(dateToJulian)

const VALID = 'day=1&month=1&year=2000&time=12&lat=51.5&lon=-0.12'

function makeApp() {
  const app = new Hono()
  app.route('/api', astroChartRoutes)
  return app
}

const MOCK_BODY = {
  name: 'Sun',
  longitude: 280.46,
  sign: 'Capricorn',
  signDegree: 10.46,
  retrograde: false,
}

describe('GET /api/getAstroChart', () => {
  beforeEach(() => {
    mockComputeChart.mockReturnValue([MOCK_BODY])
    mockDateToJulian.mockReturnValue(2451545.0)
  })

  it('returns 400 when day is missing', async () => {
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?month=1&year=2000&time=12&lat=51.5&lon=-0.12')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 when month is missing', async () => {
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?day=1&year=2000&time=12&lat=51.5&lon=-0.12')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 when year is missing', async () => {
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?day=1&month=1&time=12&lat=51.5&lon=-0.12')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 when time is missing', async () => {
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?day=1&month=1&year=2000&lat=51.5&lon=-0.12')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 when lat is missing', async () => {
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?day=1&month=1&year=2000&time=12&lon=-0.12')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 when lon is missing', async () => {
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?day=1&month=1&year=2000&time=12&lat=51.5')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })

  it('returns 400 when month is out of range', async () => {
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?day=1&month=13&year=2000&time=12&lat=51.5&lon=-0.12')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('month')
  })

  it('returns 400 when day is out of range', async () => {
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?day=32&month=1&year=2000&time=12&lat=51.5&lon=-0.12')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('day')
  })

  it('returns 400 when time is out of range', async () => {
    const app = makeApp()
    const res = await app.request('/api/getAstroChart?day=1&month=1&year=2000&time=25&lat=51.5&lon=-0.12')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('time')
  })

  it('returns 400 when lat is out of range', async () => {
    const app = makeApp()
    const res = await app.request(`/api/getAstroChart?day=1&month=1&year=2000&time=12&lat=91&lon=-0.12`)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('lat')
  })

  it('returns 400 when lon is out of range', async () => {
    const app = makeApp()
    const res = await app.request(`/api/getAstroChart?day=1&month=1&year=2000&time=12&lat=51.5&lon=181`)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('lon')
  })

  it('returns 200 with bodies array on valid input', async () => {
    const app = makeApp()
    const res = await app.request(`/api/getAstroChart?${VALID}`)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.bodies).toHaveLength(1)
    expect(body.bodies[0]).toEqual(MOCK_BODY)
  })

  it('calls dateToJulian then computeChart with correct args', async () => {
    const app = makeApp()
    await app.request(`/api/getAstroChart?${VALID}`)
    expect(mockDateToJulian).toHaveBeenCalledWith(1, 1, 2000, 12)
    expect(mockComputeChart).toHaveBeenCalledWith(2451545.0, 51.5, -0.12)
  })

  it('returns 500 when computeChart throws', async () => {
    mockComputeChart.mockImplementation(() => { throw new Error('sweph failed') })
    const app = makeApp()
    const res = await app.request(`/api/getAstroChart?${VALID}`)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })
})
