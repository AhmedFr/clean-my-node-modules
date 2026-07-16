import { describe, expect, it } from 'vitest'
import { coercePruneTarget, coerceRemoveArgs } from './validate-docker-arg'

describe('docker arg validation', () => {
  it('accepts valid remove kind/id and rejects junk', () => {
    expect(coerceRemoveArgs('image', 'sha256:aaa')).toEqual({ kind: 'image', id: 'sha256:aaa' })
    expect(coerceRemoveArgs('buildcache', 'x')).toBeNull() // no per-item build-cache removal
    expect(coerceRemoveArgs('image', '')).toBeNull()
    expect(coerceRemoveArgs('bogus', 'x')).toBeNull()
    expect(coerceRemoveArgs('image', 42)).toBeNull()
  })
  it('accepts only known prune targets', () => {
    expect(coercePruneTarget('buildCache')).toBe('buildCache')
    expect(coercePruneTarget('rm -rf /')).toBeNull()
  })
})
