import { describe, expect, it } from 'vitest'
import { pnpmCandidates } from './find-pnpm'

const HOME = '/Users/me'

describe('pnpmCandidates', () => {
  it('prefers PATH entries, in order', () => {
    const candidates = pnpmCandidates({ PATH: '/a/bin:/b/bin' }, HOME)
    expect(candidates.slice(0, 2)).toEqual(['/a/bin/pnpm', '/b/bin/pnpm'])
  })

  it('tries an explicit override binary first', () => {
    const candidates = pnpmCandidates({ PATH: '/a/bin' }, HOME, [], '/my/pnpm')
    expect(candidates[0]).toBe('/my/pnpm')
  })

  it('searches nvm bins so an npm-global / corepack pnpm is found', () => {
    const candidates = pnpmCandidates({ PATH: '' }, HOME, ['/Users/me/.nvm/versions/node/v25.2.1/bin'])
    expect(candidates).toContain('/Users/me/.nvm/versions/node/v25.2.1/bin/pnpm')
  })

  it('includes PNPM_HOME, version managers, and pnpm standalone locations', () => {
    const candidates = pnpmCandidates({ PATH: '', PNPM_HOME: '/ph' }, HOME)
    expect(candidates).toEqual([
      '/ph/pnpm',
      '/Users/me/.volta/bin/pnpm',
      '/Users/me/.asdf/shims/pnpm',
      '/opt/homebrew/bin/pnpm',
      '/usr/local/bin/pnpm',
      '/usr/bin/pnpm',
      '/Users/me/Library/pnpm/pnpm',
      '/Users/me/.local/share/pnpm/pnpm',
    ])
  })

  it('deduplicates PATH and well-known overlaps', () => {
    const candidates = pnpmCandidates({ PATH: '/opt/homebrew/bin' }, HOME)
    expect(candidates.filter((c) => c === '/opt/homebrew/bin/pnpm')).toHaveLength(1)
  })
})
