// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { longitudeToZodiac, isRetrograde } from './astroUtils'

describe('longitudeToZodiac', () => {
  it('returns Aries for 0°', () => {
    expect(longitudeToZodiac(0)).toEqual({ sign: 'Aries', signDegree: 0 })
  })

  it('returns Aries for 29.99°', () => {
    const result = longitudeToZodiac(29.99)
    expect(result.sign).toBe('Aries')
    expect(result.signDegree).toBeCloseTo(29.99, 2)
  })

  it('returns Taurus for 30°', () => {
    expect(longitudeToZodiac(30)).toEqual({ sign: 'Taurus', signDegree: 0 })
  })

  it('returns Capricorn for 280.46°', () => {
    const result = longitudeToZodiac(280.46)
    expect(result.sign).toBe('Capricorn')
    expect(result.signDegree).toBeCloseTo(10.46, 2)
  })

  it('returns Pisces for 359.99°', () => {
    const result = longitudeToZodiac(359.99)
    expect(result.sign).toBe('Pisces')
    expect(result.signDegree).toBeCloseTo(29.99, 2)
  })

  it('handles longitude >= 360 by wrapping', () => {
    expect(longitudeToZodiac(360)).toEqual({ sign: 'Aries', signDegree: 0 })
  })
})

describe('isRetrograde', () => {
  it('returns true for negative speed', () => {
    expect(isRetrograde(-0.5)).toBe(true)
  })

  it('returns false for positive speed', () => {
    expect(isRetrograde(1.2)).toBe(false)
  })

  it('returns false for zero speed', () => {
    expect(isRetrograde(0)).toBe(false)
  })
})
