// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { applyChartFields } from './useTimelineCanvas'

function createChartSpy() {
  return {
    setDay: vi.fn(),
    setMonth: vi.fn(),
    setYear: vi.fn(),
    setTime: vi.fn(),
    setLat: vi.fn(),
    setLon: vi.fn(),
  }
}

describe('applyChartFields', () => {
  it('calls only the setters for fields that are present', () => {
    const chart = createChartSpy()
    applyChartFields(chart, { year: -13_800_000_000 })

    expect(chart.setYear).toHaveBeenCalledWith(-13_800_000_000)
    expect(chart.setDay).not.toHaveBeenCalled()
    expect(chart.setMonth).not.toHaveBeenCalled()
    expect(chart.setTime).not.toHaveBeenCalled()
    expect(chart.setLat).not.toHaveBeenCalled()
    expect(chart.setLon).not.toHaveBeenCalled()
  })

  it('calls every setter when all fields are present', () => {
    const chart = createChartSpy()
    applyChartFields(chart, { day: 5, month: 3, year: 1974, time: 12, lat: 5, lon: 4 })

    expect(chart.setDay).toHaveBeenCalledWith(5)
    expect(chart.setMonth).toHaveBeenCalledWith(3)
    expect(chart.setYear).toHaveBeenCalledWith(1974)
    expect(chart.setTime).toHaveBeenCalledWith(12)
    expect(chart.setLat).toHaveBeenCalledWith(5)
    expect(chart.setLon).toHaveBeenCalledWith(4)
  })

  it('calls no setters when given an empty object', () => {
    const chart = createChartSpy()
    applyChartFields(chart, {})

    expect(chart.setDay).not.toHaveBeenCalled()
    expect(chart.setMonth).not.toHaveBeenCalled()
    expect(chart.setYear).not.toHaveBeenCalled()
    expect(chart.setTime).not.toHaveBeenCalled()
    expect(chart.setLat).not.toHaveBeenCalled()
    expect(chart.setLon).not.toHaveBeenCalled()
  })
})
