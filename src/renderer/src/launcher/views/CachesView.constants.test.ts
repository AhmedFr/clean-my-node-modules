import { describe, expect, it } from 'vitest'
import { CACHE_PLACEHOLDERS } from './CachesView.constants'

describe('CACHE_PLACEHOLDERS', () => {
  it('lists the planned package-manager caches in order with unique ids', () => {
    expect(CACHE_PLACEHOLDERS.map((c) => c.id)).toEqual(['npm', 'yarn', 'bun'])
    expect(new Set(CACHE_PLACEHOLDERS.map((c) => c.id)).size).toBe(CACHE_PLACEHOLDERS.length)
  })

  it('gives every placeholder a non-empty name and detail', () => {
    for (const c of CACHE_PLACEHOLDERS) {
      expect(c.name.trim().length).toBeGreaterThan(0)
      expect(c.detail.trim().length).toBeGreaterThan(0)
    }
  })
})
