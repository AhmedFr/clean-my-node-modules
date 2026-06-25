import type { PackageSortKey } from '@renderer/launcher/LauncherApp/LauncherApp.types'
import type { PackageEntry, PackageInventory } from '@shared/package.types'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePackages } from './usePackages'

export interface PackagesTab {
  inventory: PackageInventory | null
  computing: boolean
  sortBy: PackageSortKey
  setSortBy: (key: PackageSortKey) => void
  /** Inventory filtered by `query` and sorted by `sortBy`. */
  filtered: PackageEntry[]
  /** Name of the package whose detail panel is open, or null. */
  expandedName: string | null
  toggleExpand: (name: string) => void
  collapse: () => void
  /** Force a fresh inventory recompute. */
  refresh: () => Promise<void>
}

/**
 * All Packages-tab state and derived data — inventory, sort, search filter, and
 * accordion expansion — extracted from LauncherApp to keep that file focused.
 * `active` is true when the Packages tab is the visible list; it triggers the
 * first on-demand compute.
 */
export function usePackagesTab(query: string, active: boolean): PackagesTab {
  const { inventory, computing, ensure, refresh } = usePackages()
  const [sortBy, setSortBy] = useState<PackageSortKey>('used')
  const [expandedName, setExpandedName] = useState<string | null>(null)

  // Compute the inventory the first time the tab is shown.
  useEffect(() => {
    if (active) ensure()
  }, [active, ensure])

  // A new search collapses any open detail panel.
  // biome-ignore lint/correctness/useExhaustiveDependencies: collapse is the intended effect of a query change
  useEffect(() => {
    setExpandedName(null)
  }, [query])

  const filtered = useMemo(() => {
    const all = inventory?.packages ?? []
    const q = query.trim().toLowerCase()
    const arr = all.filter((p) => !q || p.name.toLowerCase().includes(q))
    return [...arr].sort((a, b) => {
      if (sortBy === 'size') return (b.size ?? 0) - (a.size ?? 0)
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'updates') {
        const score = (p: PackageEntry): number => (p.advisory ? 2 : 0) + (p.outdated ? 1 : 0)
        return score(b) - score(a) || b.projectCount - a.projectCount
      }
      return b.projectCount - a.projectCount // 'used'
    })
  }, [inventory, query, sortBy])

  const toggleExpand = useCallback((name: string) => {
    setExpandedName((prev) => (prev === name ? null : name))
  }, [])
  const collapse = useCallback(() => setExpandedName(null), [])

  return { inventory, computing, sortBy, setSortBy, filtered, expandedName, toggleExpand, collapse, refresh }
}
