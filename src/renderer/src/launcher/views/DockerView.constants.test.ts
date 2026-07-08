import type { DockerInfo, DockerItem } from '@shared/docker.types'
import { describe, expect, it } from 'vitest'
import { dockerItemDetail, groupDockerForDisplay, pruneEstimateBytes } from './DockerView.constants'

const item = (o: Partial<DockerItem> & Pick<DockerItem, 'id' | 'kind' | 'name'>): DockerItem => ({
  sizeBytes: 0,
  createdAt: 0,
  inUse: false,
  removable: true,
  ...o,
})
const info = (
  items: DockerItem[],
  projects = [{ name: 'myapp', workingDir: '/w', kind: 'node' as const }],
): DockerInfo => ({
  available: true,
  checkedAt: 0,
  totals: [],
  items,
  projects,
})

describe('groupDockerForDisplay', () => {
  const items = [
    item({ id: 'c1', kind: 'container', name: 'myapp-web', project: 'myapp', sizeBytes: 10 }),
    item({ id: 'i1', kind: 'image', name: 'node:20', project: 'myapp', repository: 'node', sizeBytes: 100 }),
    item({ id: 'i2', kind: 'image', name: 'redis:7', repository: 'redis', sizeBytes: 500 }),
    item({ id: 'bc', kind: 'buildcache', name: 'bc', removable: false, sizeBytes: 300 }),
    item({ id: 'v9', kind: 'volume', name: 'orphan', sizeBytes: 5 }),
  ]

  it('puts project groups first, then repository/buildcache/unaffiliated under "Other"', () => {
    const g = groupDockerForDisplay(info(items), { sortBy: 'size', typeFilter: 'all', query: '' })
    expect(g[0]).toMatchObject({ kind: 'project', project: { name: 'myapp' } })
    const kinds = g.map((x) => x.kind)
    expect(kinds).toContain('repository') // redis
    expect(kinds).toContain('buildcache')
    expect(kinds).toContain('unaffiliated') // orphan volume
    // project group before any "Other" group
    expect(kinds.indexOf('project')).toBeLessThan(kinds.indexOf('repository'))
  })

  it('sorts groups by total size when sortBy=size', () => {
    const g = groupDockerForDisplay(info(items), { sortBy: 'size', typeFilter: 'all', query: '' })
    const other = g.filter((x) => x.kind !== 'project')
    // redis repo (500) sorts before buildcache (300) before orphan volume (5)
    expect(other[0].kind === 'repository').toBe(true)
  })

  it('type filter keeps only matching items and drops empty groups', () => {
    const g = groupDockerForDisplay(info(items), { sortBy: 'size', typeFilter: 'volume', query: '' })
    expect(g.every((x) => x.items.every((i) => i.kind === 'volume'))).toBe(true)
    expect(g.some((x) => x.kind === 'repository')).toBe(false) // images filtered out
  })

  it('query filters by item name or project name', () => {
    expect(groupDockerForDisplay(info(items), { sortBy: 'size', typeFilter: 'all', query: 'redis' }).length).toBe(1)
  })
})

describe('dockerItemDetail', () => {
  const NOW = Date.UTC(2026, 0, 10)

  it('shows a relative created date and the in-use badge', () => {
    const item: DockerItem = {
      id: 'x',
      kind: 'image',
      name: 'x',
      sizeBytes: 1,
      createdAt: NOW - 86400000,
      inUse: true,
      removable: false,
    }
    expect(dockerItemDetail(item, NOW)).toBe('yesterday · in use')
  })

  it('shows "unknown date" when createdAt is 0, and the unused badge', () => {
    const item: DockerItem = {
      id: 'x',
      kind: 'image',
      name: 'x',
      sizeBytes: 1,
      createdAt: 0,
      inUse: false,
      removable: true,
    }
    expect(dockerItemDetail(item, NOW)).toBe('unknown date · unused')
  })
})

describe('pruneEstimateBytes', () => {
  const pruneItems: DockerItem[] = [
    { id: 'i1', kind: 'image', name: '<none>', sizeBytes: 1e9, createdAt: 0, inUse: false, removable: true },
    { id: 'i2', kind: 'image', name: 'old:tag', sizeBytes: 2e9, createdAt: 0, inUse: false, removable: true },
    { id: 'i3', kind: 'image', name: 'in-use:tag', sizeBytes: 5e9, createdAt: 0, inUse: true, removable: false },
    { id: 'v1', kind: 'volume', name: 'stray', sizeBytes: 3e8, createdAt: 0, inUse: false, removable: true },
    { id: 'v2', kind: 'volume', name: 'pgdata', sizeBytes: 4e8, createdAt: 0, inUse: true, removable: false },
    { id: 'c1', kind: 'container', name: 'stopped', sizeBytes: 5e7, createdAt: 0, inUse: false, removable: true },
    { id: 'c2', kind: 'container', name: 'running', sizeBytes: 6e7, createdAt: 0, inUse: true, removable: false },
    { id: 'b1', kind: 'buildcache', name: 'b1', sizeBytes: 7e6, createdAt: 0, inUse: false, removable: false },
  ]

  it('sums only untagged (dangling) removable images for danglingImages', () => {
    expect(pruneEstimateBytes(pruneItems, 'danglingImages')).toBe(1e9)
  })

  it('sums all removable images (tagged and untagged) for unusedImages', () => {
    expect(pruneEstimateBytes(pruneItems, 'unusedImages')).toBe(1e9 + 2e9)
  })

  it('sums removable containers for stoppedContainers', () => {
    expect(pruneEstimateBytes(pruneItems, 'stoppedContainers')).toBe(5e7)
  })

  it('sums all build-cache items for buildCache', () => {
    expect(pruneEstimateBytes(pruneItems, 'buildCache')).toBe(7e6)
  })

  it('sums removable volumes for unusedVolumes', () => {
    expect(pruneEstimateBytes(pruneItems, 'unusedVolumes')).toBe(3e8)
  })
})
