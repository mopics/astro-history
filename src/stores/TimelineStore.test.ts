// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { TimelineStore } from './TimelineStore'
import type { RootStore } from './RootStore'

function createStore() {
  return new TimelineStore({} as RootStore)
}

describe('TimelineStore.setVisibleCategories', () => {
  it('defaults to only yugaCustom visible', () => {
    const store = createStore()
    expect(store.visibleCategories.yugaCustom).toBe(true)
    expect(store.visibleCategories.eon).toBe(false)
  })

  it('sets given keys visible and clears all others', () => {
    const store = createStore()
    store.setVisibleCategories(['eon', 'era', 'geoPeriod'])

    expect(store.visibleCategories.eon).toBe(true)
    expect(store.visibleCategories.era).toBe(true)
    expect(store.visibleCategories.geoPeriod).toBe(true)
    expect(store.visibleCategories.yugaCustom).toBe(false)
    expect(store.visibleCategories.european).toBe(false)
  })

  it('clears all categories when given an empty array', () => {
    const store = createStore()
    store.setVisibleCategories([])

    for (const value of Object.values(store.visibleCategories)) {
      expect(value).toBe(false)
    }
  })
})
