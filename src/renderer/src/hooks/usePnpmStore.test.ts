import type { PnpmStoreInfo } from '@shared/pnpm-store.types'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean } from '../test/mock-clean-bridge'
import { usePnpmStore } from './usePnpmStore'

const store = (sizeBytes: number): PnpmStoreInfo => ({
  available: true,
  path: '/store',
  displayPath: '~/store',
  sizeBytes,
  checkedAt: 1,
  source: 'pnpm',
  canPrune: true,
})

beforeEach(() => {
  installMockClean()
})

describe('usePnpmStore', () => {
  it('loads on mount and clears loading', async () => {
    vi.mocked(window.clean.getPnpmStore).mockResolvedValue(store(100))
    const { result } = renderHook(() => usePnpmStore())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.store?.sizeBytes).toBe(100)
  })

  it('prune() re-reads the store and reports the result', async () => {
    vi.mocked(window.clean.getPnpmStore).mockResolvedValue(store(100))
    const { result } = renderHook(() => usePnpmStore())
    await waitFor(() => expect(result.current.loading).toBe(false))
    vi.mocked(window.clean.prunePnpmStore).mockResolvedValue({ ok: true, freedBytes: 40 })
    vi.mocked(window.clean.getPnpmStore).mockResolvedValue(store(60))
    await act(async () => {
      const r = await result.current.prune()
      expect(r).toEqual({ ok: true, freedBytes: 40 })
    })
    expect(result.current.store?.sizeBytes).toBe(60)
    expect(result.current.pruning).toBe(false)
  })

  it('prune() swallows failures and returns null', async () => {
    const { result } = renderHook(() => usePnpmStore())
    await waitFor(() => expect(result.current.loading).toBe(false))
    vi.mocked(window.clean.prunePnpmStore).mockRejectedValue(new Error('no pnpm'))
    await act(async () => {
      expect(await result.current.prune()).toBeNull()
    })
    expect(result.current.pruning).toBe(false)
  })

  it('refresh() forces a re-measure', async () => {
    const { result } = renderHook(() => usePnpmStore())
    await waitFor(() => expect(result.current.loading).toBe(false))
    vi.mocked(window.clean.getPnpmStore).mockResolvedValue(store(7))
    await act(async () => result.current.refresh())
    expect(vi.mocked(window.clean.getPnpmStore)).toHaveBeenLastCalledWith(true)
    expect(result.current.store?.sizeBytes).toBe(7)
  })
})
