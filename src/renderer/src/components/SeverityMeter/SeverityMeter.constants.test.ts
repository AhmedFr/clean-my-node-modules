import type { SeverityCounts } from '@renderer/lib/severity'
import { describe, expect, it } from 'vitest'
import { severityMeterTooltip, severitySegments } from './SeverityMeter.constants'

const counts = (o: Partial<SeverityCounts>): SeverityCounts => ({
  critical: 0,
  high: 0,
  moderate: 0,
  low: 0,
  vulnerable: 0,
  outdated: 0,
  ...o,
})

describe('severitySegments', () => {
  it('returns severity-ordered segments with fractions of the vulnerable total', () => {
    const segs = severitySegments(counts({ critical: 1, high: 3, vulnerable: 4 }))
    expect(segs.map((s) => s.key)).toEqual(['critical', 'high'])
    expect(segs[0].frac).toBeCloseTo(0.25)
    expect(segs[1].frac).toBeCloseTo(0.75)
  })

  it('drops zero-count severities', () => {
    const segs = severitySegments(counts({ high: 2, low: 1, vulnerable: 3 }))
    expect(segs.map((s) => s.key)).toEqual(['high', 'low'])
  })

  it('returns an empty array when nothing is vulnerable', () => {
    expect(severitySegments(counts({ outdated: 5 }))).toEqual([])
  })
})

describe('severityMeterTooltip', () => {
  it('lists every severity plus outdated and the total', () => {
    expect(
      severityMeterTooltip(counts({ critical: 2, high: 5, moderate: 3, low: 1, vulnerable: 11, outdated: 28 }), 142),
    ).toBe('2 critical · 5 high · 3 moderate · 1 low · 28 outdated of 142 packages')
  })
})
