import { SCAN_INTERVAL_MS } from '@shared/settings.constants'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScanScheduler } from './scan-scheduler'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('ScanScheduler', () => {
  it('re-runs the scan on the configured interval', () => {
    const run = vi.fn()
    const s = new ScanScheduler(run)
    s.apply('6h')
    vi.advanceTimersByTime(SCAN_INTERVAL_MS['6h'])
    expect(run).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(SCAN_INTERVAL_MS['6h'])
    expect(run).toHaveBeenCalledTimes(2)
    s.stop()
  })

  it('manual disables scheduling entirely', () => {
    const run = vi.fn()
    const s = new ScanScheduler(run)
    s.apply('6h')
    s.apply('manual')
    vi.advanceTimersByTime(SCAN_INTERVAL_MS.weekly)
    expect(run).not.toHaveBeenCalled()
  })

  it('re-applying replaces the previous timer instead of stacking', () => {
    const run = vi.fn()
    const s = new ScanScheduler(run)
    s.apply('daily')
    s.apply('daily')
    vi.advanceTimersByTime(SCAN_INTERVAL_MS.daily)
    expect(run).toHaveBeenCalledTimes(1)
    s.stop()
    vi.advanceTimersByTime(SCAN_INTERVAL_MS.daily)
    expect(run).toHaveBeenCalledTimes(1)
  })
})
