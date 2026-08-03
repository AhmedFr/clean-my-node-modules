import type { DockerActionResult, DockerInfo } from '@shared/docker.types'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean } from '../test/mock-clean-bridge'
import { useDocker } from './useDocker'

const info = (checkedAt: number): DockerInfo => ({
  available: true,
  checkedAt,
  totals: [],
  items: [],
  projects: [],
})

beforeEach(() => {
  installMockClean()
})

describe('useDocker', () => {
  it('loads once on mount and clears loading', async () => {
    vi.mocked(window.clean.getDocker).mockResolvedValue(info(1))
    const { result } = renderHook(() => useDocker())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.info?.checkedAt).toBe(1)
    expect(vi.mocked(window.clean.getDocker)).toHaveBeenCalledWith()
  })

  it('remove() sets busyId for the item, refreshes with force, then clears', async () => {
    vi.mocked(window.clean.getDocker).mockResolvedValue(info(1))
    const { result } = renderHook(() => useDocker())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let resolveRemove!: (r: DockerActionResult) => void
    vi.mocked(window.clean.removeDockerItem).mockReturnValue(
      new Promise<DockerActionResult>((r) => {
        resolveRemove = r
      }),
    )
    vi.mocked(window.clean.getDocker).mockResolvedValue(info(2))
    act(() => {
      void result.current.remove('image', 'img1')
    })
    expect(result.current.busyId).toBe('img1')
    await act(async () => resolveRemove({ ok: true, freedBytes: 10 }))
    await waitFor(() => expect(result.current.busyId).toBeNull())
    expect(vi.mocked(window.clean.getDocker)).toHaveBeenLastCalledWith(true)
    expect(result.current.info?.checkedAt).toBe(2)
  })

  it('prune() marks busy as prune:<target> and clears even when the call rejects', async () => {
    const { result } = renderHook(() => useDocker())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let rejectPrune!: (e: Error) => void
    vi.mocked(window.clean.pruneDocker).mockReturnValue(
      new Promise<DockerActionResult>((_, reject) => {
        rejectPrune = reject
      }),
    )
    let pruneCall!: Promise<unknown>
    act(() => {
      pruneCall = result.current.prune('buildCache')
      pruneCall.catch(() => {})
    })
    expect(result.current.busyId).toBe('prune:buildCache')

    await act(async () => {
      rejectPrune(new Error('boom'))
      await expect(pruneCall).rejects.toThrow('boom')
    })
    expect(result.current.busyId).toBeNull()
  })
})
