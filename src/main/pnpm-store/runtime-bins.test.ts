import { describe, expect, it } from 'vitest'
import { versionManagerBinDirs } from './runtime-bins'

const HOME = '/Users/me'

describe('versionManagerBinDirs', () => {
  it('prefers PATH entries, in order', () => {
    const dirs = versionManagerBinDirs({ PATH: '/a/bin:/b/bin' }, HOME, [])
    expect(dirs.slice(0, 2)).toEqual(['/a/bin', '/b/bin'])
  })

  it('inserts PNPM_HOME then nvm bins (newest first) before other well-knowns', () => {
    const dirs = versionManagerBinDirs({ PATH: '', PNPM_HOME: '/ph' }, HOME, [
      '/Users/me/.nvm/versions/node/v25.2.1/bin',
      '/Users/me/.nvm/versions/node/v20.0.0/bin',
    ])
    expect(dirs).toEqual([
      '/ph',
      '/Users/me/.nvm/versions/node/v25.2.1/bin',
      '/Users/me/.nvm/versions/node/v20.0.0/bin',
      '/Users/me/.volta/bin',
      '/Users/me/.asdf/shims',
      '/opt/homebrew/bin',
      '/usr/local/bin',
      '/usr/bin',
    ])
  })

  it('omits PNPM_HOME when unset and dedups PATH overlaps', () => {
    const dirs = versionManagerBinDirs({ PATH: '/opt/homebrew/bin' }, HOME, [])
    expect(dirs[0]).toBe('/opt/homebrew/bin')
    expect(dirs.filter((d) => d === '/opt/homebrew/bin')).toHaveLength(1)
  })
})
