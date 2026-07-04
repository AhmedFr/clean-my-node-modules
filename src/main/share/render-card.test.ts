import { describe, expect, it } from 'vitest'
import { coerceCardPayload, fmtGB, renderCardHtml } from './render-card'

const GB = 1024 ** 3
const valid = { totalBytes: 247.3 * GB, nodeModulesBytes: 214 * GB, storeBytes: 33.3 * GB, projectsCount: 14 }

describe('coerceCardPayload', () => {
  it('accepts a valid payload and defaults source to reveal', () => {
    expect(coerceCardPayload(valid)).toMatchObject({ ...valid, source: 'reveal' })
    expect(coerceCardPayload({ ...valid, source: 'header' })?.source).toBe('header')
  })
  it('rejects garbage, negatives, non-finite, missing fields, zero total, bad source', () => {
    for (const bad of [
      null,
      42,
      'x',
      {},
      { ...valid, totalBytes: -1 },
      { ...valid, storeBytes: Number.NaN },
      { ...valid, projectsCount: Number.POSITIVE_INFINITY },
      { ...valid, totalBytes: 0 },
      { ...valid, source: 'evil' },
      (() => {
        const { storeBytes, ...rest } = valid
        return rest
      })(),
    ]) {
      expect(coerceCardPayload(bad)).toBeNull()
    }
  })
  it('caps absurd values at 1 PB', () => {
    expect(coerceCardPayload({ ...valid, totalBytes: 1e18 })?.totalBytes).toBe(1e15)
  })
})

describe('fmtGB', () => {
  it('scales decimals with magnitude', () => {
    expect(fmtGB(3.217 * GB)).toBe('3.22')
    expect(fmtGB(47.31 * GB)).toBe('47.3')
    expect(fmtGB(247.3 * GB)).toBe('247')
  })
})

describe('renderCardHtml', () => {
  const html = renderCardHtml({ ...valid, source: 'reveal' })
  it('contains the numbers, the brand, and the domain', () => {
    expect(html).toContain('247')
    expect(html).toContain('14 projects')
    expect(html).toContain('TidyDisk')
    expect(html).toContain('tidydisk.app')
  })
  it('never contains em dashes or project-identifying content', () => {
    expect(html).not.toContain('—')
  })
})
