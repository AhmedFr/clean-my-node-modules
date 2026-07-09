import { GB } from '@renderer/lib/format'
import type { SeverityCounts } from '@renderer/lib/severity'
import { describe, expect, it } from 'vitest'
import { type TabSummaryInput, tabSummary } from './tabSummary'

const sev = (o: Partial<SeverityCounts> = {}): SeverityCounts => ({
  critical: 0,
  high: 0,
  moderate: 0,
  low: 0,
  vulnerable: 0,
  outdated: 0,
  ...o,
})
const base: TabSummaryInput = {
  tab: 'projects',
  projectsUsed: 0,
  cachesUsed: 0,
  cachesAvailable: true,
  dockerUsed: 0,
  dockerAvailable: true,
  thresholdGB: 5,
  cacheThresholdGB: 10,
  dockerThresholdGB: 20,
  severity: sev(),
  packagesComputing: false,
  packagesHasData: true,
}

describe('tabSummary', () => {
  it('projects: percent under limit, over amount past it', () => {
    expect(tabSummary({ ...base, tab: 'projects', projectsUsed: 2.5 * GB })).toBe('50% of your 5 GB limit')
    expect(tabSummary({ ...base, tab: 'projects', projectsUsed: 6 * GB })).toBe('1.00 GB over your 5 GB limit')
  })

  it('caches: uses the cache limit and wording, null when unavailable', () => {
    expect(tabSummary({ ...base, tab: 'caches', cachesUsed: 5 * GB })).toBe('50% of your 10 GB cache limit')
    expect(tabSummary({ ...base, tab: 'caches', cachesAvailable: false })).toBeNull()
  })

  it('docker: uses the docker limit and wording, null when unavailable', () => {
    expect(tabSummary({ ...base, tab: 'docker', dockerUsed: 10 * GB })).toBe('50% of your 20 GB Docker limit')
    expect(tabSummary({ ...base, tab: 'docker', dockerAvailable: false })).toBeNull()
  })

  it('packages: vulnerable + outdated, all-clear, and null while computing with no data', () => {
    expect(tabSummary({ ...base, tab: 'packages', severity: sev({ vulnerable: 7, outdated: 28 }) })).toBe(
      '7 vulnerable · 28 outdated',
    )
    expect(tabSummary({ ...base, tab: 'packages', severity: sev({ outdated: 3 }) })).toBe('all clear · 3 outdated')
    expect(tabSummary({ ...base, tab: 'packages', severity: sev() })).toBe('all clear')
    expect(tabSummary({ ...base, tab: 'packages', packagesComputing: true, packagesHasData: false })).toBeNull()
  })
})
