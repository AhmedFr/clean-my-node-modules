import { describe, expect, it } from 'vitest'
import { dockerCandidates } from './find-docker'

describe('dockerCandidates', () => {
  it('puts an explicit override first and includes Docker Desktop + homebrew paths', () => {
    const c = dockerCandidates({ PATH: '/usr/bin' }, '/Users/x', [], '/opt/homebrew/bin/docker')
    expect(c[0]).toBe('/opt/homebrew/bin/docker')
    expect(c).toContain('/usr/local/bin/docker')
    expect(c).toContain('/Applications/Docker.app/Contents/Resources/bin/docker')
  })

  it('dedupes and works with no override', () => {
    const c = dockerCandidates({ PATH: '/usr/local/bin' }, '/Users/x', [])
    expect(new Set(c).size).toBe(c.length)
    expect(c).toContain('/usr/local/bin/docker')
  })
})
