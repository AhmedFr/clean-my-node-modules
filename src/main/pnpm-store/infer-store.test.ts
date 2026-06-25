import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { inferStoreDir, newestVersionDir, storeRootCandidates } from './infer-store'

const HOME = '/Users/me'

describe('storeRootCandidates', () => {
  it('lists PNPM_HOME, the mac standalone, and XDG-style roots', () => {
    expect(storeRootCandidates({ PNPM_HOME: '/ph' }, HOME)).toEqual([
      '/ph/store',
      '/Users/me/Library/pnpm/store',
      '/Users/me/.local/share/pnpm/store',
    ])
  })

  it('omits PNPM_HOME when unset and adds XDG_DATA_HOME when set', () => {
    expect(storeRootCandidates({ XDG_DATA_HOME: '/xdg' }, HOME)).toEqual([
      '/Users/me/Library/pnpm/store',
      '/Users/me/.local/share/pnpm/store',
      '/xdg/pnpm/store',
    ])
  })
})

describe('newestVersionDir', () => {
  it('picks the highest v<N> entry', () => {
    expect(newestVersionDir(['v3', 'v11', 'v10', 'tmp'])).toBe('v11')
  })
  it('returns null when no version dir exists', () => {
    expect(newestVersionDir(['tmp', 'files'])).toBeNull()
  })
})

describe('inferStoreDir', () => {
  let home: string
  beforeAll(() => {
    home = mkdtempSync(join(tmpdir(), 'cmnm-store-'))
    mkdirSync(join(home, 'Library', 'pnpm', 'store', 'v3'), { recursive: true })
    mkdirSync(join(home, 'Library', 'pnpm', 'store', 'v11'), { recursive: true })
  })
  afterAll(() => rmSync(home, { recursive: true, force: true }))

  it('returns the newest version dir under the first existing root', async () => {
    expect(await inferStoreDir({}, home)).toBe(join(home, 'Library', 'pnpm', 'store', 'v11'))
  })

  it('returns null when no candidate root exists', async () => {
    expect(await inferStoreDir({}, '/no/such/home')).toBeNull()
  })
})
