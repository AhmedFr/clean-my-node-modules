import { describe, expect, it } from 'vitest'
import { buildDockerItems, parseDate, parseDf, parseSize } from './docker-parse'

const DF = JSON.stringify({
  Images: [
    {
      ID: 'sha256:aaa',
      Repository: 'node',
      Tag: '20',
      CreatedAt: '2026-01-02 10:00:00 +0000 UTC',
      Size: '1.1GB',
      Containers: '1',
    },
    {
      ID: 'sha256:bbb',
      Repository: '<none>',
      Tag: '<none>',
      CreatedAt: '2026-01-01 10:00:00 +0000 UTC',
      Size: '400MB',
      Containers: '0',
    },
  ],
  Volumes: [
    { Name: 'pgdata', Size: '2.0GB', Links: '1' },
    { Name: 'scratch', Size: '512MB', Links: '0' },
  ],
  Containers: [
    {
      ID: 'ctr111',
      Names: 'web',
      State: 'running',
      Image: 'node:20',
      CreatedAt: '2026-01-03 10:00:00 +0000 UTC',
      Size: '10MB',
    },
    {
      ID: 'ctr222',
      Names: 'old',
      State: 'exited',
      Image: 'node:20',
      CreatedAt: '2026-01-02 09:00:00 +0000 UTC',
      Size: '5MB',
    },
    {
      ID: 'ctr333',
      Names: 'paused-one',
      State: 'paused',
      Image: 'node:20',
      CreatedAt: '2026-01-02 09:30:00 +0000 UTC',
      Size: '6MB',
    },
  ],
  BuildCache: [{ ID: 'cache1', Size: '800MB', CreatedAt: '2026-01-01 08:00:00 +0000 UTC', InUse: 'false' }],
})

describe('parseSize', () => {
  it('parses docker human sizes to bytes', () => {
    expect(parseSize('0B')).toBe(0)
    expect(parseSize('512MB')).toBe(512 * 1000 * 1000)
    expect(parseSize('1.1GB')).toBeCloseTo(1.1 * 1e9, -6)
    expect(parseSize('')).toBe(0)
  })
})

describe('parseDate', () => {
  it('parses docker UTC timestamps to the correct epoch', () => {
    expect(parseDate('2026-01-02 10:00:00 +0000 UTC')).toBe(Date.parse('2026-01-02T10:00:00Z'))
    expect(parseDate('2026-01-02 10:00:00.482635131 +0000 UTC')).toBe(Date.parse('2026-01-02T10:00:00Z'))
    expect(parseDate('')).toBe(0)
    expect(parseDate('not a date')).toBe(0)
  })

  it('honors a non-UTC numeric offset', () => {
    expect(parseDate('2026-01-02 10:00:00 +0530 IST')).toBe(Date.parse('2026-01-02T10:00:00+05:30'))
  })
})

describe('buildDockerItems', () => {
  const df = parseDf(DF)
  const { items, totals } = buildDockerItems(df)

  it('marks dangling/untagged images unused+removable and tagged-in-container in-use', () => {
    const dangling = items.find((i) => i.id === 'sha256:bbb')
    expect(dangling?.inUse).toBe(false)
    expect(dangling?.removable).toBe(true)
    const used = items.find((i) => i.id === 'sha256:aaa')
    expect(used?.inUse).toBe(true) // Containers > 0
    expect(used?.removable).toBe(false)
  })

  it('marks volumes with Links>0 in-use (not removable) and Links=0 removable', () => {
    expect(items.find((i) => i.name === 'pgdata')?.removable).toBe(false)
    expect(items.find((i) => i.name === 'scratch')?.removable).toBe(true)
  })

  it('only stopped containers are removable', () => {
    expect(items.find((i) => i.id === 'ctr111')?.removable).toBe(false) // running
    expect(items.find((i) => i.id === 'ctr222')?.removable).toBe(true) // exited
  })

  it('paused containers are in-use and not removable (docker rm refuses paused)', () => {
    const paused = items.find((i) => i.id === 'ctr333')
    expect(paused?.inUse).toBe(true)
    expect(paused?.removable).toBe(false)
  })

  it('build-cache rows are never per-item removable', () => {
    expect(items.find((i) => i.kind === 'buildcache')?.removable).toBe(false)
  })

  it('totals reclaimable = sum of removable item sizes per kind', () => {
    const vol = totals.find((t) => t.kind === 'volume')
    expect(vol?.reclaimableBytes).toBe(512 * 1000 * 1000) // only scratch
    expect(vol?.count).toBe(2)
  })
})
