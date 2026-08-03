import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean, type MockClean } from '../test/mock-clean-bridge'
import { useLicense } from './useLicense'

let bridge: MockClean
beforeEach(() => {
  bridge = installMockClean()
})

describe('useLicense', () => {
  it('starts free, loads the stored state, follows change broadcasts', async () => {
    vi.mocked(window.clean.getLicense).mockResolvedValue({ pro: true, email: 'a@b.c' })
    const { result } = renderHook(() => useLicense())
    expect(result.current.license).toEqual({ pro: false })
    await waitFor(() => expect(result.current.license.pro).toBe(true))

    act(() => bridge.emit.licenseChanged({ pro: false, needsReverify: true }))
    expect(result.current.license.needsReverify).toBe(true)
  })

  it('activate() applies the returned state on success and not on failure', async () => {
    const { result } = renderHook(() => useLicense())
    vi.mocked(window.clean.activateLicense).mockResolvedValue({ ok: false, reason: 'network' })
    await act(async () => {
      const r = await result.current.activate('bad-key')
      expect(r.ok).toBe(false)
    })
    expect(result.current.license.pro).toBe(false)

    vi.mocked(window.clean.activateLicense).mockResolvedValue({ ok: true, state: { pro: true } })
    await act(async () => {
      await result.current.activate('good-key')
    })
    expect(result.current.license.pro).toBe(true)
  })

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(() => useLicense())
    expect(bridge.listeners.license).toBe(1)
    unmount()
    expect(bridge.listeners.license).toBe(0)
  })
})
