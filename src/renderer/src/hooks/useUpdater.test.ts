import type { UpdaterState } from '@shared/updater.types'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean, type MockClean } from '../test/mock-clean-bridge'
import { useUpdater } from './useUpdater'

let bridge: MockClean
beforeEach(() => {
  bridge = installMockClean()
})

const downloaded: UpdaterState = {
  currentVersion: '1.1.0',
  checkedAt: 123,
  status: {
    phase: 'downloaded',
    info: { version: '1.2.0', releaseDate: '', sizeBytes: 0, notes: null },
  },
}

describe('useUpdater', () => {
  it('fetches the snapshot then follows state broadcasts', async () => {
    vi.mocked(window.clean.getUpdaterState).mockResolvedValue({
      currentVersion: '1.1.0',
      checkedAt: null,
      status: { phase: 'idle' },
    })
    const { result } = renderHook(() => useUpdater())
    await waitFor(() => expect(result.current.state.currentVersion).toBe('1.1.0'))
    act(() => bridge.emit.updaterState(downloaded))
    expect(result.current.state.status.phase).toBe('downloaded')
  })

  it('exposes the three actions as bridge passthroughs', () => {
    const { result } = renderHook(() => useUpdater())
    result.current.check()
    result.current.download()
    result.current.install()
    expect(vi.mocked(window.clean.updaterCheck)).toHaveBeenCalledOnce()
    expect(vi.mocked(window.clean.updaterDownload)).toHaveBeenCalledOnce()
    expect(vi.mocked(window.clean.updaterInstall)).toHaveBeenCalledOnce()
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useUpdater())
    expect(bridge.listeners.updater).toBe(1)
    unmount()
    expect(bridge.listeners.updater).toBe(0)
  })
})
