import type { DockerItem } from '@shared/docker.types'
import { describe, expect, it } from 'vitest'
import { dockerItemDetail, groupDockerItems } from './DockerView.constants'

const items: DockerItem[] = [
  { id: 'i1', kind: 'image', name: 'node:20', sizeBytes: 1e9, createdAt: 0, inUse: false, removable: true },
  { id: 'v1', kind: 'volume', name: 'pgdata', sizeBytes: 2e9, createdAt: 0, inUse: true, removable: false },
  { id: 'c1', kind: 'container', name: 'app', sizeBytes: 3e8, createdAt: 0, inUse: true, removable: false },
]

describe('groupDockerItems', () => {
  it('groups items by kind in Images/Volumes/Containers/Build cache order, omitting empty groups', () => {
    const groups = groupDockerItems(items, '')
    expect(groups.map((g) => g.label)).toEqual(['Images', 'Volumes', 'Containers'])
    expect(groups.find((g) => g.label === 'Images')?.items.map((i) => i.name)).toEqual(['node:20'])
  })

  it('filters items by name, case-insensitively', () => {
    const groups = groupDockerItems(items, 'NODE')
    expect(groups).toHaveLength(1)
    expect(groups[0]?.label).toBe('Images')
    expect(groups[0]?.items.map((i) => i.name)).toEqual(['node:20'])
  })

  it('returns no groups when nothing matches the query', () => {
    expect(groupDockerItems(items, 'zzz')).toEqual([])
  })

  it('returns no groups for an empty item list', () => {
    expect(groupDockerItems([], '')).toEqual([])
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
