import { describe, expect, it } from 'vitest'
import { abbreviateHome } from './abbreviate-home'

describe('abbreviateHome', () => {
  it('replaces the home prefix with ~', () => {
    expect(abbreviateHome('/Users/me/code/app', '/Users/me')).toBe('~/code/app')
  })
  it('leaves non-home paths untouched', () => {
    expect(abbreviateHome('/Volumes/Ext/code', '/Users/me')).toBe('/Volumes/Ext/code')
  })
  it('abbreviates the home directory itself to ~', () => {
    expect(abbreviateHome('/Users/me', '/Users/me')).toBe('~')
  })
  it('leaves sibling paths sharing the home prefix untouched', () => {
    expect(abbreviateHome('/Users/mean', '/Users/me')).toBe('/Users/mean')
  })
})
