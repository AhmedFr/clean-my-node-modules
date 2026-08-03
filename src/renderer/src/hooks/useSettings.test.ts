import { DEFAULT_SETTINGS } from '@shared/settings.constants'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean, type MockClean } from '../test/mock-clean-bridge'
import { useSettings } from './useSettings'

let bridge: MockClean
beforeEach(() => {
  bridge = installMockClean()
})

describe('useSettings', () => {
  it('serves defaults until the first fetch resolves, then flips loaded', async () => {
    vi.mocked(window.clean.getSettings).mockResolvedValue({ ...DEFAULT_SETTINGS, thresholdGB: 42 })
    const { result } = renderHook(() => useSettings())
    expect(result.current[0]).toEqual(DEFAULT_SETTINGS)
    expect(result.current[2]).toBe(false)
    await waitFor(() => expect(result.current[2]).toBe(true))
    expect(result.current[0].thresholdGB).toBe(42)
  })

  it('setSetting applies optimistically and forwards to the bridge', async () => {
    const { result } = renderHook(() => useSettings())
    await waitFor(() => expect(result.current[2]).toBe(true))
    act(() => {
      void result.current[1]('scanInterval', 'manual')
    })
    // optimistic: local state updated before the IPC round-trip resolves
    expect(result.current[0].scanInterval).toBe('manual')
    expect(vi.mocked(window.clean.setSetting)).toHaveBeenCalledWith('scanInterval', 'manual')
  })

  it('follows settings broadcasts and unsubscribes on unmount', async () => {
    const { result, unmount } = renderHook(() => useSettings())
    act(() => bridge.emit.settingsChanged({ ...DEFAULT_SETTINGS, notify: false }))
    expect(result.current[0].notify).toBe(false)
    expect(bridge.listeners.settings).toBe(1)
    unmount()
    expect(bridge.listeners.settings).toBe(0)
  })
})
