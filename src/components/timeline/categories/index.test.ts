// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { TIMELINE_CATEGORIES, TIMELINE_GROUPS } from './index'

describe('TIMELINE_GROUPS / TIMELINE_CATEGORIES grouping', () => {
  it('every category belongs to a declared group', () => {
    const groupKeys = new Set(TIMELINE_GROUPS.map(g => g.key))
    for (const category of TIMELINE_CATEGORIES) {
      expect(groupKeys.has(category.group)).toBe(true)
    }
  })

  it('every group has at least one category', () => {
    for (const group of TIMELINE_GROUPS) {
      const count = TIMELINE_CATEGORIES.filter(c => c.group === group.key).length
      expect(count).toBeGreaterThan(0)
    }
  })

  it('groups categories per the Geological/Historic/Religious/Astronomical spec', () => {
    const byGroup = (key: string) =>
      TIMELINE_CATEGORIES.filter(c => c.group === key).map(c => c.key)

    expect(byGroup('geological')).toEqual(['eon', 'era', 'geoPeriod'])
    expect(byGroup('historic')).toEqual(['european'])
    expect(byGroup('religious')).toEqual(['yugaTraditional', 'yugaCustom', 'yugaYukteswar'])
    expect(byGroup('astronomical')).toEqual(['precession'])
  })
})
