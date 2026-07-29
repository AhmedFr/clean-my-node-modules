import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean } from '../../test/mock-clean-bridge'
import { useLiveProjects } from './useLiveProjects'

beforeEach(() => {
  installMockClean()
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('useLiveProjects', () => {
  it('fetches immediately, then re-polls every 45s', async () => {
    vi.mocked(window.clean.getLiveProjects).mockResolvedValue({ a: { pid: 1, command: 'node' } })
    const { result } = renderHook(() => useLiveProjects())
    await act(async () => {}) // flush the initial tick's promise
    expect(result.current).toEqual({ a: { pid: 1, command: 'node' } })

    vi.mocked(window.clean.getLiveProjects).mockResolvedValue({})
    await act(async () => {
      vi.advanceTimersByTime(45_000)
    })
    expect(result.current).toEqual({})
    expect(vi.mocked(window.clean.getLiveProjects)).toHaveBeenCalledTimes(2)
  })

  it('stops polling after unmount', async () => {
    const { unmount } = renderHook(() => useLiveProjects())
    await act(async () => {})
    unmount()
    await act(async () => {
      vi.advanceTimersByTime(45_000 * 3)
    })
    // Only the interval teardown is observable; React 18 makes any late
    // post-unmount setLive a silent no-op, so the active guard can't be asserted.
    expect(vi.mocked(window.clean.getLiveProjects)).toHaveBeenCalledTimes(1)
  })
})
