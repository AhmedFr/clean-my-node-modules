import { describe, expect, it } from 'vitest'
import { listExternalVolumes } from './list-external-volumes'

// dev map: '/' is boot (dev 1); SSD is separate (dev 2); GhostLink unreadable.
const deps = {
  volumesDir: '/Volumes',
  readdir: async () => ['Macintosh HD', 'SSD-T7', 'GhostLink'],
  statDev: (p: string) => {
    const map: Record<string, number | null> = {
      '/': 1,
      '/Volumes/Macintosh HD': 1,
      '/Volumes/SSD-T7': 2,
      '/Volumes/GhostLink': null, // unreadable/broken
    }
    return p in map ? map[p] : null
  },
}

describe('listExternalVolumes', () => {
  it('returns only separate-device volumes, excluding the boot disk', async () => {
    expect(await listExternalVolumes(deps)).toEqual([{ path: '/Volumes/SSD-T7', name: 'SSD-T7' }])
  })
})
