import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToast } from './useToast'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useToast', () => {
  it('shows the toast then auto-clears after 2400ms', () => {
    const { result } = renderHook(() => useToast<string>())
    expect(result.current.toast).toBeNull()
    act(() => result.current.flashToast('saved'))
    expect(result.current.toast).toBe('saved')
    act(() => vi.advanceTimersByTime(2399))
    expect(result.current.toast).toBe('saved')
    act(() => vi.advanceTimersByTime(1))
    expect(result.current.toast).toBeNull()
  })

  it('re-flashing replaces the toast and restarts the clock', () => {
    const { result } = renderHook(() => useToast<string>())
    act(() => result.current.flashToast('first'))
    act(() => vi.advanceTimersByTime(2000))
    act(() => result.current.flashToast('second'))
    act(() => vi.advanceTimersByTime(2000))
    expect(result.current.toast).toBe('second')
    act(() => vi.advanceTimersByTime(400))
    expect(result.current.toast).toBeNull()
  })
})
