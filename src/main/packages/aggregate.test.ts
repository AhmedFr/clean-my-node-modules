import { describe, expect, it } from 'vitest'
import { aggregatePackages } from './aggregate'
import type { NamedUsage } from './read-manifest'

const usage = (name: string, projectId: string, version: string, dev = false): NamedUsage => ({
  name,
  usage: { projectId, projectName: projectId, version, dev },
})

describe('aggregatePackages', () => {
  it('groups usages by package name with a per-project count', () => {
    const out = aggregatePackages([usage('react', 'p1', '18.3.1'), usage('react', 'p2', '18.3.1')])
    const react = out.find((p) => p.name === 'react')
    expect(react?.projectCount).toBe(2)
    expect(react?.usages).toHaveLength(2)
  })

  it('collects distinct in-use versions sorted ascending', () => {
    const out = aggregatePackages([
      usage('lodash', 'p1', '4.17.21'),
      usage('lodash', 'p2', '4.17.5'),
      usage('lodash', 'p3', '4.17.21'),
    ])
    const lodash = out.find((p) => p.name === 'lodash')
    expect(lodash?.versions).toEqual(['4.17.5', '4.17.21'])
  })

  it('flags multipleVersions only when more than one version is in use', () => {
    const out = aggregatePackages([
      usage('react', 'p1', '18.3.1'),
      usage('react', 'p2', '17.0.2'),
      usage('vue', 'p1', '3.4.0'),
    ])
    expect(out.find((p) => p.name === 'react')?.multipleVersions).toBe(true)
    expect(out.find((p) => p.name === 'vue')?.multipleVersions).toBe(false)
  })

  it('counts distinct projects, not raw usage rows', () => {
    // same project listed twice (defensive) collapses to one project
    const out = aggregatePackages([usage('react', 'p1', '18.3.1'), usage('react', 'p1', '18.3.1')])
    expect(out.find((p) => p.name === 'react')?.projectCount).toBe(1)
  })

  it('sorts entries by project count desc, then name', () => {
    const out = aggregatePackages([
      usage('rare', 'p1', '1.0.0'),
      usage('common', 'p1', '1.0.0'),
      usage('common', 'p2', '1.0.0'),
    ])
    expect(out.map((p) => p.name)).toEqual(['common', 'rare'])
  })
})
