import { describe, expect, it } from 'vitest'
import { kindFromDeps } from './detect-kind'

describe('kindFromDeps', () => {
  it('falls back to node when nothing matches', () => {
    expect(kindFromDeps({})).toBe('node')
    expect(kindFromDeps({ lodash: '^4', express: '^4' })).toBe('node')
  })

  it('detects single frameworks', () => {
    expect(kindFromDeps({ next: '14' })).toBe('next')
    expect(kindFromDeps({ vue: '3' })).toBe('vue')
    expect(kindFromDeps({ svelte: '4' })).toBe('svelte')
    expect(kindFromDeps({ astro: '4' })).toBe('astro')
    expect(kindFromDeps({ vite: '5' })).toBe('vite')
    expect(kindFromDeps({ typescript: '5' })).toBe('ts')
  })

  it('maps react-native / expo to expo', () => {
    expect(kindFromDeps({ expo: '50' })).toBe('expo')
    expect(kindFromDeps({ 'react-native': '0.73' })).toBe('expo')
  })

  it('respects specificity order (most specific wins)', () => {
    // next ships react+vite, but next is more specific
    expect(kindFromDeps({ next: '14', react: '18', vite: '5' })).toBe('next')
    // a plain react+vite app is react, not vite
    expect(kindFromDeps({ react: '18', vite: '5', typescript: '5' })).toBe('react')
    // nuxt/vue before react
    expect(kindFromDeps({ vue: '3', react: '18' })).toBe('vue')
  })

  it('ignores undefined dependency values', () => {
    expect(kindFromDeps({ next: undefined, react: '18' })).toBe('react')
  })
})
