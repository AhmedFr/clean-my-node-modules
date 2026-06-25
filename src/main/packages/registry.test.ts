import type { PackageEntry, PackageUsage } from '@shared/package.types'
import { describe, expect, it } from 'vitest'
import { enrichEntries, isOutdated, pickWorstAdvisory, type RawAdvisory, type RegistryClient } from './registry'

const u = (version: string, unresolved = false): PackageUsage => ({
  projectId: `p-${version}`,
  projectName: 'p',
  version,
  ...(unresolved ? { unresolved: true } : {}),
  dev: false,
})

const entry = (name: string, usages: PackageUsage[]): PackageEntry => ({
  name,
  usages,
  projectCount: usages.length,
  versions: [...new Set(usages.map((x) => x.version))],
  multipleVersions: new Set(usages.map((x) => x.version)).size > 1,
})

describe('isOutdated', () => {
  it('is true when any in-use version is behind latest', () => {
    expect(isOutdated(['18.0.0', '18.3.1'], '18.3.1')).toBe(true)
  })
  it('is false when all in-use versions are at or ahead of latest', () => {
    expect(isOutdated(['18.3.1'], '18.3.1')).toBe(false)
    expect(isOutdated(['19.0.0'], '18.3.1')).toBe(false)
  })
  it('is false when there are no comparable versions', () => {
    expect(isOutdated([], '18.3.1')).toBe(false)
  })
})

describe('pickWorstAdvisory', () => {
  const advisories: RawAdvisory[] = [
    { title: 'Moderate ReDoS', severity: 'moderate', vulnerable_versions: '<4.17.20', url: 'u1' },
    { title: 'Prototype Pollution', severity: 'high', vulnerable_versions: '<4.17.21', url: 'u2' },
  ]

  it('returns the highest-severity advisory matching an in-use version', () => {
    const worst = pickWorstAdvisory(advisories, ['4.17.15'])
    expect(worst).toMatchObject({ severity: 'high', title: 'Prototype Pollution', vulnerableVersions: '<4.17.21' })
  })

  it('ignores advisories whose range no in-use version satisfies', () => {
    // 4.17.20 is < 4.17.21 (high applies) but NOT < 4.17.20 (moderate excluded)
    const worst = pickWorstAdvisory(advisories, ['4.17.20'])
    expect(worst?.severity).toBe('high')
  })

  it('returns undefined when no in-use version is vulnerable', () => {
    expect(pickWorstAdvisory(advisories, ['4.17.21'])).toBeUndefined()
  })
})

describe('enrichEntries', () => {
  it('fills latest, outdated and advisory from the registry client', async () => {
    const entries = [entry('react', [u('18.0.0')]), entry('lodash', [u('4.17.15')])]
    const client: RegistryClient = {
      fetchLatest: async (name) => (name === 'react' ? '18.3.1' : '4.17.21'),
      fetchAdvisories: async () => ({
        lodash: [{ title: 'Prototype Pollution', severity: 'high', vulnerable_versions: '<4.17.21', url: 'u' }],
      }),
    }
    const result = await enrichEntries(entries, client)
    expect(result.enrichmentError).toBeUndefined()
    expect(entries[0]).toMatchObject({ latest: '18.3.1', outdated: true })
    expect(entries[0].advisory).toBeUndefined()
    expect(entries[1]).toMatchObject({ latest: '4.17.21', outdated: true })
    expect(entries[1].advisory?.severity).toBe('high')
  })

  it('records the worst advisory per in-use version', async () => {
    const entries = [entry('lodash', [u('4.17.15'), u('4.17.21')])]
    const client: RegistryClient = {
      fetchLatest: async () => '4.17.21',
      fetchAdvisories: async () => ({
        lodash: [{ title: 'Prototype Pollution', severity: 'high', vulnerable_versions: '<4.17.21', url: 'u' }],
      }),
    }
    await enrichEntries(entries, client)
    // 4.17.15 is vulnerable, 4.17.21 is not
    expect(entries[0].advisoriesByVersion?.['4.17.15']?.severity).toBe('high')
    expect(entries[0].advisoriesByVersion?.['4.17.21']).toBeUndefined()
  })

  it('reports an enrichmentError and preserves local data when the client throws', async () => {
    const entries = [entry('react', [u('18.0.0')])]
    entries[0].size = 1234 // local data must survive
    const client: RegistryClient = {
      fetchLatest: async () => {
        throw new Error('getaddrinfo ENOTFOUND registry.npmjs.org')
      },
      fetchAdvisories: async () => ({}),
    }
    const result = await enrichEntries(entries, client)
    expect(result.enrichmentError).toMatch(/ENOTFOUND|registry/i)
    expect(entries[0].latest).toBeUndefined()
    expect(entries[0].size).toBe(1234)
  })
})
