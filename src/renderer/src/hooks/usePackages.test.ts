import type { PackageInventory } from '@shared/package.types'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean } from '../test/mock-clean-bridge'
import { usePackages } from './usePackages'

const inv = (computedAt: number): PackageInventory => ({ packages: [], computedAt, projectCount: 0 })

beforeEach(() => {
  installMockClean()
})

describe('usePackages', () => {
  it('shows a cached inventory immediately when main has one', async () => {
    vi.mocked(window.clean.getPackages).mockResolvedValue(inv(1))
    const { result } = renderHook(() => usePackages())
    await waitFor(() => expect(result.current.inventory?.computedAt).toBe(1))
    expect(vi.mocked(window.clean.computePackages)).not.toHaveBeenCalled()
  })

  it('ensure() computes exactly once, refresh() forces', async () => {
    vi.mocked(window.clean.computePackages).mockResolvedValue(inv(2))
    const { result } = renderHook(() => usePackages())
    await act(async () => {
      result.current.ensure()
      result.current.ensure()
    })
    expect(vi.mocked(window.clean.computePackages)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(window.clean.computePackages)).toHaveBeenCalledWith(false)
    expect(result.current.inventory?.computedAt).toBe(2)

    vi.mocked(window.clean.computePackages).mockResolvedValue(inv(3))
    await act(async () => result.current.refresh())
    expect(vi.mocked(window.clean.computePackages)).toHaveBeenLastCalledWith(true)
    expect(result.current.inventory?.computedAt).toBe(3)
    expect(result.current.computing).toBe(false)
  })
})
