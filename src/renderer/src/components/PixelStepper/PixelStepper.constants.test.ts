import { describe, expect, it } from 'vitest'
import { STEPPER_CELLS, clampGb, gbToIndex, indexToGb, nudgeGb } from './PixelStepper.constants'

describe('PixelStepper helpers', () => {
  it('exposes 10 whole-GB cells', () => {
    expect(STEPPER_CELLS).toBe(10)
  })

  it('clamps to the 1–10 GB range', () => {
    expect(clampGb(0)).toBe(1)
    expect(clampGb(99)).toBe(10)
    expect(clampGb(5)).toBe(5)
    expect(clampGb(Number.NaN)).toBe(1)
  })

  it('maps GB to a 0-based block index, rounding fractional values', () => {
    expect(gbToIndex(1)).toBe(0)
    expect(gbToIndex(5)).toBe(4)
    expect(gbToIndex(10)).toBe(9)
    expect(gbToIndex(5.5)).toBe(5) // rounds up to the 6 GB block
  })

  it('maps a block index back to whole GB', () => {
    expect(indexToGb(0)).toBe(1)
    expect(indexToGb(9)).toBe(10)
    expect(indexToGb(99)).toBe(10)
  })

  it('nudges by one GB step and clamps at the ends', () => {
    expect(nudgeGb(5, 1)).toBe(6)
    expect(nudgeGb(5, -1)).toBe(4)
    expect(nudgeGb(10, 1)).toBe(10)
    expect(nudgeGb(1, -1)).toBe(1)
  })
})
