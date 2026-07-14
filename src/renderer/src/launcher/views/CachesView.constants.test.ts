import type { IconRenderer } from '@renderer/components/UIIcon'
import { describe, expect, it } from 'vitest'
import { CACHE_PLACEHOLDERS, type LiveCache, visibleCaches } from './CachesView.constants'

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

describe('visibleCaches', () => {
  const stubIcon: IconRenderer = () => null
  const cache = (name: string): LiveCache => ({ id: name, icon: stubIcon, name, detail: '' })
  const caches = [cache('pnpm store'), cache('Docker build cache')]

  it('returns every cache with its original index when the query is empty', () => {
    expect(visibleCaches(caches, '')).toEqual([
      { cache: caches[0], index: 0 },
      { cache: caches[1], index: 1 },
    ])
  })

  it('filters by name case-insensitively, preserving the original index', () => {
    const r = visibleCaches(caches, 'DOCKER')
    expect(r).toHaveLength(1)
    expect(r[0]).toEqual({ cache: caches[1], index: 1 })
  })

  it('returns nothing when no cache matches', () => {
    expect(visibleCaches(caches, 'zzz')).toEqual([])
  })
})
