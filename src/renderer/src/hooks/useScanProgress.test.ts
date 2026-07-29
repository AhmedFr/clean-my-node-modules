import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { installMockClean, type MockClean } from '../test/mock-clean-bridge'
import { useScanProgress } from './useScanProgress'

let bridge: MockClean
beforeEach(() => {
  bridge = installMockClean()
})

describe('useScanProgress', () => {
  it('is null until an event arrives, then mirrors the latest event', () => {
    const { result } = renderHook(() => useScanProgress())
    expect(result.current).toBeNull()
    act(() => bridge.emit.scanProgress({ foldersChecked: 5, currentPath: '/a', done: false }))
    expect(result.current?.foldersChecked).toBe(5)
    act(() => bridge.emit.scanProgress({ foldersChecked: 9, currentPath: '', done: true }))
    expect(result.current?.done).toBe(true)
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useScanProgress())
    expect(bridge.listeners.scanProgress).toBe(1)
    unmount()
    expect(bridge.listeners.scanProgress).toBe(0)
  })
})
