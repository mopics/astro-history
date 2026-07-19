// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { buildPeriodTreeData, toCategoryKeys } from './periodTree'

describe('buildPeriodTreeData', () => {
  it('builds one parent node per group, each with its categories as children', () => {
    const tree = buildPeriodTreeData()

    expect(tree.map(node => node.key)).toEqual([
      'group:geological',
      'group:historic',
      'group:religious',
      'group:astronomical',
    ])

    const geological = tree.find(node => node.key === 'group:geological')!
    expect(geological.children.map(c => c.key)).toEqual(['eon', 'era', 'geoPeriod'])
    expect(geological.children.map(c => c.title)).toEqual(['Eon', 'Era', 'Period'])

    const religious = tree.find(node => node.key === 'group:religious')!
    expect(religious.children.map(c => c.key)).toEqual([
      'yugaTraditional',
      'yugaCustom',
      'yugaYukteswar',
    ])
  })
})

describe('toCategoryKeys', () => {
  it('keeps real category keys and drops synthetic group keys', () => {
    const result = toCategoryKeys(['group:geological', 'eon', 'era', 'geoPeriod'])
    expect(result).toEqual(['eon', 'era', 'geoPeriod'])
  })

  it('returns an empty array when nothing is checked', () => {
    expect(toCategoryKeys([])).toEqual([])
  })

  it('drops unknown keys that are not declared categories', () => {
    expect(toCategoryKeys(['not-a-real-key', 'precession'])).toEqual(['precession'])
  })
})
