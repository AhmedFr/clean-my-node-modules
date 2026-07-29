import type { Project } from '@shared/project.types'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean, type MockClean, makeProject } from '../test/mock-clean-bridge'
import { useProjects } from './useProjects'

let bridge: MockClean
beforeEach(() => {
  bridge = installMockClean()
})

describe('useProjects', () => {
  it('loads the initial inventory then follows change events', async () => {
    const first = [makeProject({ id: 'a' })]
    vi.mocked(window.clean.getProjects).mockResolvedValue(first)
    const { result } = renderHook(() => useProjects())
    expect(result.current).toEqual([])
    await waitFor(() => expect(result.current).toEqual(first))

    const next = [makeProject({ id: 'b' })]
    act(() => bridge.emit.projectsChanged(next))
    expect(result.current).toEqual(next)
  })

  it('unsubscribes on unmount and ignores a late initial fetch', async () => {
    let resolve!: (p: Project[]) => void
    vi.mocked(window.clean.getProjects).mockReturnValue(
      new Promise<Project[]>((r) => {
        resolve = r
      }),
    )
    const { unmount } = renderHook(() => useProjects())
    expect(bridge.listeners.projects).toBe(1)
    unmount()
    expect(bridge.listeners.projects).toBe(0)
    // the `alive` guard: resolving after unmount must not throw or set state
    await act(async () => resolve([makeProject()]))
  })
})
