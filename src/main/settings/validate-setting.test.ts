import { describe, expect, it } from 'vitest'
import { coerceSetting } from './validate-setting'

describe('coerceSetting', () => {
  it('accepts valid enum values', () => {
    expect(coerceSetting('sizeStyle', 'bar')).toEqual({ key: 'sizeStyle', value: 'bar' })
    expect(coerceSetting('density', 'compact')).toEqual({ key: 'density', value: 'compact' })
    expect(coerceSetting('scanInterval', 'weekly')).toEqual({ key: 'scanInterval', value: 'weekly' })
  })

  it('rejects values outside the enum', () => {
    expect(coerceSetting('sizeStyle', 'huge')).toBeNull()
    expect(coerceSetting('density', 42)).toBeNull()
    expect(coerceSetting('scanInterval', 'hourly')).toBeNull()
  })

  it('validates accent as a hex color', () => {
    expect(coerceSetting('accent', '#ff6363')).toEqual({ key: 'accent', value: '#ff6363' })
    expect(coerceSetting('accent', '#abc')).toEqual({ key: 'accent', value: '#abc' })
    expect(coerceSetting('accent', 'red')).toBeNull()
    expect(coerceSetting('accent', 'javascript:alert(1)')).toBeNull()
  })

  it('clamps thresholdGB and rejects non-finite numbers', () => {
    expect(coerceSetting('thresholdGB', 5)).toEqual({ key: 'thresholdGB', value: 5 })
    expect(coerceSetting('thresholdGB', 99999)).toEqual({ key: 'thresholdGB', value: 1000 })
    expect(coerceSetting('thresholdGB', -3)).toEqual({ key: 'thresholdGB', value: 0.1 })
    expect(coerceSetting('thresholdGB', Number.NaN)).toBeNull()
    expect(coerceSetting('thresholdGB', '5')).toBeNull()
  })

  it('validates notify as boolean', () => {
    expect(coerceSetting('notify', false)).toEqual({ key: 'notify', value: false })
    expect(coerceSetting('notify', 'true')).toBeNull()
  })

  it('coerces the onboarded boolean flag', () => {
    expect(coerceSetting('onboarded', true)).toEqual({ key: 'onboarded', value: true })
    expect(coerceSetting('onboarded', false)).toEqual({ key: 'onboarded', value: false })
    expect(coerceSetting('onboarded', 'yes')).toBeNull()
    expect(coerceSetting('onboarded', 1)).toBeNull()
  })

  it('rejects unknown keys', () => {
    expect(coerceSetting('__proto__', {})).toBeNull()
    expect(coerceSetting('nope', 1)).toBeNull()
  })
})

describe('coerceSetting — pnpm overrides', () => {
  it('accepts and trims a pnpm store path', () => {
    expect(coerceSetting('pnpmStorePath', '  /Users/me/Library/pnpm/store/v11  ')).toEqual({
      key: 'pnpmStorePath',
      value: '/Users/me/Library/pnpm/store/v11',
    })
  })

  it('accepts a pnpm binary path', () => {
    expect(coerceSetting('pnpmBinaryPath', '/opt/homebrew/bin/pnpm')).toEqual({
      key: 'pnpmBinaryPath',
      value: '/opt/homebrew/bin/pnpm',
    })
  })

  it('clears an override when given an empty/whitespace string', () => {
    expect(coerceSetting('pnpmStorePath', '   ')).toEqual({ key: 'pnpmStorePath', value: '' })
  })

  it('rejects a non-string override', () => {
    expect(coerceSetting('pnpmBinaryPath', 42)).toBeNull()
  })
})

describe('scanRoots', () => {
  it('accepts an array of absolute paths', () => {
    expect(coerceSetting('scanRoots', ['/Volumes/SSD', '/data/projects'])).toEqual({
      key: 'scanRoots',
      value: ['/Volumes/SSD', '/data/projects'],
    })
  })
  it('accepts an empty array', () => {
    expect(coerceSetting('scanRoots', [])).toEqual({ key: 'scanRoots', value: [] })
  })
  it('rejects a non-array', () => {
    expect(coerceSetting('scanRoots', '/Volumes/SSD')).toBeNull()
  })
  it('rejects relative paths', () => {
    expect(coerceSetting('scanRoots', ['relative/path'])).toBeNull()
  })
  it('rejects non-string members', () => {
    expect(coerceSetting('scanRoots', ['/ok', 42])).toBeNull()
  })
})
