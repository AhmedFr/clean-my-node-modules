import type { PackageEntry } from '@shared/package.types'
import { describe, expect, it } from 'vitest'
import { severityCounts } from './severity'

const pkg = (o: Partial<PackageEntry> & Pick<PackageEntry, 'name'>): PackageEntry => ({
  usages: [],
  projectCount: 1,
  versions: [],
  multipleVersions: false,
  ...o,
})

describe('severityCounts', () => {
  it('buckets each package by its advisory severity and sums vulnerable', () => {
    const c = severityCounts([
      pkg({ name: 'a', advisory: { severity: 'critical', title: '', vulnerableVersions: '' } }),
      pkg({ name: 'b', advisory: { severity: 'high', title: '', vulnerableVersions: '' } }),
      pkg({ name: 'c', advisory: { severity: 'high', title: '', vulnerableVersions: '' } }),
      pkg({ name: 'd', advisory: { severity: 'low', title: '', vulnerableVersions: '' } }),
      pkg({ name: 'e' }), // no advisory
    ])
    expect(c).toEqual({ critical: 1, high: 2, moderate: 0, low: 1, vulnerable: 4, outdated: 0 })
  })

  it('counts outdated independently of advisories', () => {
    const c = severityCounts([
      pkg({ name: 'a', outdated: true }),
      pkg({ name: 'b', outdated: true, advisory: { severity: 'moderate', title: '', vulnerableVersions: '' } }),
      pkg({ name: 'c', outdated: false }),
    ])
    expect(c.outdated).toBe(2)
    expect(c.moderate).toBe(1)
    expect(c.vulnerable).toBe(1)
  })

  it('returns all zeros for an empty list', () => {
    expect(severityCounts([])).toEqual({ critical: 0, high: 0, moderate: 0, low: 0, vulnerable: 0, outdated: 0 })
  })
})
