import { describe, expect, it } from 'vitest'
import { resolveScanRoots } from './resolve-scan-roots'

const opts = (present: string[]) => ({ home: '/Users/me', exists: (p: string) => present.includes(p) })

describe('resolveScanRoots', () => {
  it('always includes home first', () => {
    expect(resolveScanRoots([], opts(['/Users/me']))).toEqual(['/Users/me'])
  })
  it('adds mounted extra roots and drops unmounted ones', () => {
    const out = resolveScanRoots(['/Volumes/SSD', '/Volumes/Gone'], opts(['/Users/me', '/Volumes/SSD']))
    expect(out).toEqual(['/Users/me', '/Volumes/SSD'])
  })
  it('dedupes identical paths', () => {
    const out = resolveScanRoots(['/Volumes/SSD', '/Volumes/SSD'], opts(['/Users/me', '/Volumes/SSD']))
    expect(out).toEqual(['/Users/me', '/Volumes/SSD'])
  })
  it('drops a root nested inside another kept root', () => {
    const out = resolveScanRoots(['/Users/me/projects'], opts(['/Users/me', '/Users/me/projects']))
    expect(out).toEqual(['/Users/me'])
  })
})
