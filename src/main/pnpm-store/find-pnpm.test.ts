import { describe, expect, it } from 'vitest'
import { pnpmCandidates } from './find-pnpm'

const HOME = '/Users/me'

describe('pnpmCandidates', () => {
  it('prefers PATH entries, in order', () => {
    const candidates = pnpmCandidates({ PATH: '/a/bin:/b/bin' }, HOME)
    expect(candidates.slice(0, 2)).toEqual(['/a/bin/pnpm', '/b/bin/pnpm'])
  })

  it('includes PNPM_HOME and well-known mac locations when PATH misses', () => {
    const candidates = pnpmCandidates({ PATH: '', PNPM_HOME: '/custom/pnpm-home' }, HOME)
    expect(candidates).toEqual([
      '/custom/pnpm-home/pnpm',
      '/Users/me/Library/pnpm/pnpm',
      '/Users/me/.local/share/pnpm/pnpm',
      '/opt/homebrew/bin/pnpm',
      '/usr/local/bin/pnpm',
    ])
  })

  it('deduplicates PATH and well-known overlaps', () => {
    const candidates = pnpmCandidates({ PATH: '/opt/homebrew/bin' }, HOME)
    expect(candidates.filter((c) => c === '/opt/homebrew/bin/pnpm')).toHaveLength(1)
  })

  it('omits PNPM_HOME when unset', () => {
    const candidates = pnpmCandidates({}, HOME)
    expect(candidates[0]).toBe('/Users/me/Library/pnpm/pnpm')
  })
})
