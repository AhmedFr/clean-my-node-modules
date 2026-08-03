import type { PackageEntry, PackageInventory } from '@shared/package.types'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { installMockClean } from '../test/mock-clean-bridge'
import { usePackagesTab } from './usePackagesTab'

function entry(name: string, over: Partial<PackageEntry> = {}): PackageEntry {
  return { name, usages: [], projectCount: 1, versions: ['1.0.0'], multipleVersions: false, ...over }
}

const inventory: PackageInventory = {
  packages: [
    entry('react', { projectCount: 5, size: 10 }),
    entry('lodash', { projectCount: 2, size: 300, outdated: true }),
    entry('axios', {
      projectCount: 3,
      size: 50,
      advisory: { severity: 'high', title: 'ssrf', vulnerableVersions: '<1' },
    }),
  ],
  computedAt: 1,
  projectCount: 5,
}

beforeEach(() => {
  installMockClean()
  vi.mocked(window.clean.getPackages).mockResolvedValue(inventory)
  vi.mocked(window.clean.computePackages).mockResolvedValue(inventory)
})

function mount(query = '', active = true) {
  return renderHook(({ q, a }) => usePackagesTab(q, a), { initialProps: { q: query, a: active } })
}

describe('usePackagesTab', () => {
  it('computes on first activation only', async () => {
    const { rerender } = mount('', false)
    expect(vi.mocked(window.clean.computePackages)).not.toHaveBeenCalled()
    rerender({ q: '', a: true })
    await waitFor(() => expect(vi.mocked(window.clean.computePackages)).toHaveBeenCalledTimes(1))
    rerender({ q: '', a: false })
    rerender({ q: '', a: true })
    expect(vi.mocked(window.clean.computePackages)).toHaveBeenCalledTimes(1)
  })

  it('default sort is by projectCount; size/name/updates re-sort', async () => {
    const { result } = mount()
    await waitFor(() => expect(result.current.filtered).toHaveLength(3))
    expect(result.current.filtered.map((p) => p.name)).toEqual(['react', 'axios', 'lodash'])
    act(() => result.current.setSortBy('size'))
    expect(result.current.filtered.map((p) => p.name)).toEqual(['lodash', 'axios', 'react'])
    act(() => result.current.setSortBy('name'))
    expect(result.current.filtered.map((p) => p.name)).toEqual(['axios', 'lodash', 'react'])
    act(() => result.current.setSortBy('updates'))
    // advisory (2) beats outdated (1) beats clean (0)
    expect(result.current.filtered.map((p) => p.name)).toEqual(['axios', 'lodash', 'react'])
  })

  it('filters by query and a query change collapses the open panel', async () => {
    const { result, rerender } = mount()
    await waitFor(() => expect(result.current.filtered).toHaveLength(3))
    act(() => result.current.toggleExpand('react'))
    expect(result.current.expandedName).toBe('react')
    rerender({ q: 'lo', a: true })
    expect(result.current.expandedName).toBeNull()
    expect(result.current.filtered.map((p) => p.name)).toEqual(['lodash'])
  })

  it('toggleExpand toggles and collapse clears', async () => {
    const { result } = mount()
    await waitFor(() => expect(result.current.filtered).toHaveLength(3))
    act(() => result.current.toggleExpand('axios'))
    act(() => result.current.toggleExpand('axios'))
    expect(result.current.expandedName).toBeNull()
    act(() => result.current.toggleExpand('axios'))
    act(() => result.current.collapse())
    expect(result.current.expandedName).toBeNull()
  })
})
