import { describe, expect, it } from 'vitest'
import { BLUR_GRACE_MS, blurShouldDismiss } from './blur-grace'

describe('blurShouldDismiss', () => {
  it('never dismisses while devtools are focused', () => {
    expect(blurShouldDismiss(10_000, true)).toBe(false)
  })
  it('ignores a blur inside the grace window (the just-opened spurious blur)', () => {
    expect(blurShouldDismiss(0, false)).toBe(false)
    expect(blurShouldDismiss(BLUR_GRACE_MS - 1, false)).toBe(false)
  })
  it('dismisses once past the grace window (a genuine click-away)', () => {
    expect(blurShouldDismiss(BLUR_GRACE_MS, false)).toBe(true)
    expect(blurShouldDismiss(5_000, false)).toBe(true)
  })
})
