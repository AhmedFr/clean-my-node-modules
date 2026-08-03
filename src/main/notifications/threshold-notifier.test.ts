import { GB } from '@shared/units.constants'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  shown: [] as Array<{ title: string; body: string }>,
  clicks: [] as Array<() => void>,
  supported: { value: true },
}))

vi.mock('electron', () => ({
  Notification: class {
    static isSupported = (): boolean => mocks.supported.value
    constructor(private opts: { title: string; body: string }) {}
    on(event: string, fn: () => void): void {
      if (event === 'click') mocks.clicks.push(fn)
    }
    show(): void {
      mocks.shown.push(this.opts)
    }
  },
}))

import { ThresholdNotifier } from './threshold-notifier'

beforeEach(() => {
  mocks.shown.length = 0
  mocks.clicks.length = 0
  mocks.supported.value = true
})

describe('ThresholdNotifier', () => {
  it('fires once when usage crosses the threshold, not while it stays over', () => {
    const n = new ThresholdNotifier(() => {})
    n.check(4 * GB, 5, true)
    expect(mocks.shown).toHaveLength(0)
    n.check(6 * GB, 5, true)
    expect(mocks.shown).toHaveLength(1)
    expect(mocks.shown[0].body).toContain('6.00 GB')
    n.check(7 * GB, 5, true)
    expect(mocks.shown).toHaveLength(1)
  })

  it('re-arms after dropping back below the threshold', () => {
    const n = new ThresholdNotifier(() => {})
    n.check(6 * GB, 5, true)
    n.check(4 * GB, 5, true)
    n.check(6 * GB, 5, true)
    expect(mocks.shown).toHaveLength(2)
  })

  it('never fires when disabled or unsupported', () => {
    const n = new ThresholdNotifier(() => {})
    n.check(6 * GB, 5, false)
    mocks.supported.value = false
    n.check(4 * GB, 5, true) // reset below
    n.check(6 * GB, 5, true)
    expect(mocks.shown).toHaveLength(0)
  })

  it('clicking the notification opens the app', () => {
    const onOpen = vi.fn()
    const n = new ThresholdNotifier(onOpen)
    n.check(6 * GB, 5, true)
    mocks.clicks[0]()
    expect(onOpen).toHaveBeenCalledOnce()
  })
})
