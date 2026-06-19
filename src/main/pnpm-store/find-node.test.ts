import { describe, expect, it } from 'vitest'
import { nodeCandidates } from './find-node'

const HOME = '/Users/me'

describe('nodeCandidates', () => {
  it('prefers PATH entries, in order', () => {
    const candidates = nodeCandidates({ PATH: '/a/bin:/b/bin' }, HOME)
    expect(candidates.slice(0, 2)).toEqual(['/a/bin/node', '/b/bin/node'])
  })

  it('includes nvm version bins (newest first) when PATH misses node', () => {
    const candidates = nodeCandidates({ PATH: '' }, HOME, [
      '/Users/me/.nvm/versions/node/v25.2.1/bin',
      '/Users/me/.nvm/versions/node/v20.0.0/bin',
    ])
    expect(candidates.slice(0, 2)).toEqual([
      '/Users/me/.nvm/versions/node/v25.2.1/bin/node',
      '/Users/me/.nvm/versions/node/v20.0.0/bin/node',
    ])
  })

  it('includes PNPM_HOME, volta, asdf and well-known mac locations', () => {
    const candidates = nodeCandidates({ PATH: '', PNPM_HOME: '/custom/pnpm-home' }, HOME)
    expect(candidates).toEqual([
      '/custom/pnpm-home/node',
      '/Users/me/.volta/bin/node',
      '/Users/me/.asdf/shims/node',
      '/opt/homebrew/bin/node',
      '/usr/local/bin/node',
      '/usr/bin/node',
    ])
  })

  it('deduplicates PATH and well-known overlaps', () => {
    const candidates = nodeCandidates({ PATH: '/opt/homebrew/bin' }, HOME)
    expect(candidates.filter((c) => c === '/opt/homebrew/bin/node')).toHaveLength(1)
  })

  it('omits PNPM_HOME when unset', () => {
    const candidates = nodeCandidates({}, HOME)
    expect(candidates[0]).toBe('/Users/me/.volta/bin/node')
  })
})
