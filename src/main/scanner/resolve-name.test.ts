import { describe, expect, it } from 'vitest'
import { chooseName } from './resolve-name'

describe('chooseName', () => {
  it('keeps a specific folder name as-is', () => {
    expect(chooseName({ folder: 'my-cool-lib', repoName: 'my-cool-lib' })).toBe('my-cool-lib')
    expect(chooseName({ folder: 'recipe-app', repoName: 'monorepo' })).toBe('recipe-app')
  })

  it('qualifies a generic name with the repo root', () => {
    expect(chooseName({ folder: 'frontend', repoName: 'selfkit' })).toBe('selfkit / frontend')
    expect(chooseName({ folder: 'framework', repoName: 'activepieces', parentName: 'community' })).toBe(
      'activepieces / framework',
    )
  })

  it('prefers a meaningful package.json name over qualification', () => {
    expect(chooseName({ folder: 'web', repoName: 'acme', pkgName: '@acme/web-dashboard' })).toBe('web-dashboard')
  })

  it('ignores a generic package.json name and qualifies instead', () => {
    expect(chooseName({ folder: 'web', repoName: 'acme', pkgName: '@acme/web' })).toBe('acme / web')
  })

  it('falls back to a specific parent folder when there is no repo', () => {
    expect(chooseName({ folder: 'api', repoName: null, parentName: 'acme' })).toBe('acme / api')
  })

  it('does not qualify when repo/parent are also generic or identical', () => {
    expect(chooseName({ folder: 'frontend', repoName: 'frontend' })).toBe('frontend')
    expect(chooseName({ folder: 'api', repoName: null, parentName: 'packages' })).toBe('api')
  })
})
