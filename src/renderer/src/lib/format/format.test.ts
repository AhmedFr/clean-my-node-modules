import { describe, expect, it } from 'vitest'
import { formatSize, formatSizeStr, GB, MB, relativeTime, staleness } from './format'

const DAY = 86400000
const NOW = 1_800_000_000_000

describe('formatSize', () => {
  it('formats gigabytes with two decimals', () => {
    expect(formatSize(1.5 * GB)).toEqual({ value: '1.50', unit: 'GB' })
  })

  it('formats megabytes rounded', () => {
    expect(formatSize(612 * MB)).toEqual({ value: '612', unit: 'MB' })
  })

  it('formats kilobytes with a floor of 1', () => {
    expect(formatSize(10)).toEqual({ value: '1', unit: 'KB' })
    expect(formatSize(2048)).toEqual({ value: '2', unit: 'KB' })
  })

  it('joins value and unit in formatSizeStr', () => {
    expect(formatSizeStr(612 * MB)).toBe('612 MB')
  })
})

describe('relativeTime', () => {
  it('says today and yesterday', () => {
    expect(relativeTime(NOW, NOW)).toBe('today')
    expect(relativeTime(NOW - DAY, NOW)).toBe('yesterday')
  })

  it('uses days under a week', () => {
    expect(relativeTime(NOW - 4 * DAY, NOW)).toBe('4 days ago')
  })

  it('uses weeks under a month', () => {
    expect(relativeTime(NOW - 23 * DAY, NOW)).toBe('3 weeks ago')
  })

  it('uses months under a year', () => {
    expect(relativeTime(NOW - 132 * DAY, NOW)).toBe('4 months ago')
  })

  it('uses years beyond that', () => {
    expect(relativeTime(NOW - 408 * DAY, NOW)).toBe('1 year ago')
    expect(relativeTime(NOW - 800 * DAY, NOW)).toBe('2 years ago')
  })
})

describe('staleness', () => {
  it('is 0 for fresh projects and capped at 1', () => {
    expect(staleness(NOW, NOW)).toBe(0)
    expect(staleness(NOW - 1000 * DAY, NOW)).toBe(1)
  })

  it('scales linearly to 540 days', () => {
    expect(staleness(NOW - 270 * DAY, NOW)).toBeCloseTo(0.5)
  })
})
