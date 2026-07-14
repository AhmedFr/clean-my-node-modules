import type { DockerInfo, DockerItem } from '@shared/docker.types'
import { describe, expect, it } from 'vitest'
import {
  type DisplayGroup,
  dockerBuildCacheBytes,
  dockerGroupActive,
  dockerItemDetail,
  groupDockerForDisplay,
  PRUNE_BUTTON_LABEL,
  projectRowExpanded,
  pruneEstimateBytes,
  prunesForGroup,
} from './DockerView.constants'

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

  it('puts project groups first, then repository/unaffiliated under "Other"', () => {
    const g = groupDockerForDisplay(info(items), { sortBy: 'size', typeFilter: 'all', query: '' })
    expect(g[0]).toMatchObject({ kind: 'project', project: { name: 'myapp' } })
    const kinds = g.map((x) => x.kind)
    expect(kinds).toContain('repository') // redis
    expect(kinds).toContain('unaffiliated') // orphan volume
    // project group before any "Other" group
    expect(kinds.indexOf('project')).toBeLessThan(kinds.indexOf('repository'))
  })

  it('never groups build-cache items (they moved to the Caches tab)', () => {
    const g = groupDockerForDisplay(info(items), { sortBy: 'size', typeFilter: 'all', query: '' })
    expect(g.some((x) => x.kind === ('buildcache' as unknown))).toBe(false)
    expect(g.every((x) => x.items.every((i) => i.kind !== 'buildcache'))).toBe(true)
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

  it('does not throw when info.projects is missing (stale cache from an older build)', () => {
    // A docker-cache.json written before project enrichment has no `projects` field.
    const stale = { available: true, checkedAt: 0, totals: [], items } as unknown as DockerInfo
    const g = groupDockerForDisplay(stale, { sortBy: 'size', typeFilter: 'all', query: '' })
    // No project groups; every item falls into the "Other" section instead of crashing.
    expect(g.some((x) => x.kind === 'project')).toBe(false)
    expect(g.length).toBeGreaterThan(0)
  })
})

describe('dockerItemDetail', () => {
  const NOW = Date.UTC(2026, 0, 10)

  it('shows a relative created date (in-use is shown as a dot, not text)', () => {
    const item: DockerItem = {
      id: 'x',
      kind: 'image',
      name: 'x',
      sizeBytes: 1,
      createdAt: NOW - 86400000,
      inUse: true,
      removable: false,
    }
    expect(dockerItemDetail(item, NOW)).toBe('yesterday')
  })

  it('shows "unknown date" when createdAt is 0', () => {
    const item: DockerItem = {
      id: 'x',
      kind: 'image',
      name: 'x',
      sizeBytes: 1,
      createdAt: 0,
      inUse: false,
      removable: true,
    }
    expect(dockerItemDetail(item, NOW)).toBe('unknown date')
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

describe('prunesForGroup', () => {
  const group = (o: Partial<DisplayGroup> & Pick<DisplayGroup, 'kind' | 'items'>): DisplayGroup =>
    ({ id: 'g', label: 'g', ...o }) as DisplayGroup

  it('repository group with a removable tagged image offers unusedImages only', () => {
    const g = group({
      kind: 'repository',
      items: [item({ id: 'i1', kind: 'image', name: 'redis:7', removable: true })],
    })
    expect(prunesForGroup(g)).toEqual(['unusedImages'])
  })

  it('repository group with a dangling <none> image also offers danglingImages', () => {
    const g = group({
      kind: 'repository',
      items: [item({ id: 'i1', kind: 'image', name: '<none>', removable: true })],
    })
    expect(prunesForGroup(g)).toEqual(['danglingImages', 'unusedImages'])
  })

  it('unaffiliated group with a dangling <none> image offers both danglingImages and unusedImages', () => {
    const g = group({
      kind: 'unaffiliated',
      items: [item({ id: 'i1', kind: 'image', name: '<none>', removable: true })],
    })
    expect(prunesForGroup(g)).toEqual(['danglingImages', 'unusedImages'])
  })

  it('unaffiliated group with a volume and a removable container offers unusedVolumes and stoppedContainers', () => {
    const g = group({
      kind: 'unaffiliated',
      items: [
        item({ id: 'v1', kind: 'volume', name: 'orphan', removable: true }),
        item({ id: 'c1', kind: 'container', name: 'stopped', removable: true }),
      ],
    })
    expect(prunesForGroup(g)).toEqual(['unusedVolumes', 'stoppedContainers'])
  })

  it('project group offers no prune targets', () => {
    const g = {
      kind: 'project' as const,
      id: 'p',
      label: 'p',
      project: { name: 'myapp' },
      items: [item({ id: 'i1', kind: 'image', name: 'x', removable: true })],
    }
    expect(prunesForGroup(g)).toEqual([])
  })
})

describe('dockerGroupActive', () => {
  it('is true when any item is in use', () => {
    expect(
      dockerGroupActive([
        item({ id: 'a', kind: 'image', name: 'a', inUse: false }),
        item({ id: 'b', kind: 'volume', name: 'b', inUse: true }),
      ]),
    ).toBe(true)
  })
  it('is false when no item is in use', () => {
    expect(dockerGroupActive([item({ id: 'a', kind: 'image', name: 'a', inUse: false })])).toBe(false)
  })
  it('is false for an empty group', () => {
    expect(dockerGroupActive([])).toBe(false)
  })
})

describe('projectRowExpanded', () => {
  it('a non-empty query expands every project regardless of the accordion id', () => {
    expect(projectRowExpanded(true, null, 'project:x')).toBe(true)
    expect(projectRowExpanded(true, 'project:y', 'project:x')).toBe(true)
  })
  it('with no query, only the accordion-selected id is expanded', () => {
    expect(projectRowExpanded(false, 'project:x', 'project:x')).toBe(true)
    expect(projectRowExpanded(false, 'project:y', 'project:x')).toBe(false)
    expect(projectRowExpanded(false, null, 'project:x')).toBe(false)
  })
})

describe('PRUNE_BUTTON_LABEL', () => {
  it('leads every label with the word "Delete" so the button reads as destructive', () => {
    for (const label of Object.values(PRUNE_BUTTON_LABEL)) {
      expect(label.startsWith('Delete ')).toBe(true)
    }
  })

  it('has no em dashes', () => {
    for (const label of Object.values(PRUNE_BUTTON_LABEL)) {
      expect(label.includes('—')).toBe(false)
    }
  })
})

describe('dockerBuildCacheBytes', () => {
  it('sums only build-cache items', () => {
    const items: DockerItem[] = [
      { id: 'b1', kind: 'buildcache', name: 'b1', sizeBytes: 100, createdAt: 0, inUse: false, removable: false },
      { id: 'b2', kind: 'buildcache', name: 'b2', sizeBytes: 250, createdAt: 0, inUse: false, removable: false },
      { id: 'i1', kind: 'image', name: 'redis', sizeBytes: 999, createdAt: 0, inUse: false, removable: true },
    ]
    expect(dockerBuildCacheBytes(items)).toBe(350)
  })

  it('is 0 when there are no build-cache items', () => {
    expect(dockerBuildCacheBytes([])).toBe(0)
  })
})
