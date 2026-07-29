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

  it('unsubscribes on unmount; late fetch resolution is safe', async () => {
    let resolve!: (p: Project[]) => void
    vi.mocked(window.clean.getProjects).mockReturnValue(
      new Promise<Project[]>((r) => {
        resolve = r
      }),
    )
    const { result, unmount } = renderHook(() => useProjects())
    expect(bridge.listeners.projects).toBe(1)
    unmount()
    expect(bridge.listeners.projects).toBe(0)
    // React 18 makes post-unmount setState a no-op, so the alive guard has no
    // observable effect to assert — this only proves late resolution is safe.
    await act(async () => resolve([makeProject()]))
    expect(result.current).toEqual([])
  })
})
