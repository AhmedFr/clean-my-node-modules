import type { PackageInventory } from '@shared/package.types'
import { useCallback, useEffect, useRef, useState } from 'react'

interface UsePackages {
  inventory: PackageInventory | null
  computing: boolean
  /** Compute once (no-op if already loaded); call when the tab first opens. */
  ensure: () => void
  /** Force a fresh recompute. */
  refresh: () => Promise<void>
}

/** Computer-wide package inventory, computed on demand and cached in main. */
export function usePackages(): UsePackages {
  const [inventory, setInventory] = useState<PackageInventory | null>(null)
  const [computing, setComputing] = useState(false)
  const started = useRef(false)

  // Show the cached inventory immediately if main already has one.
  useEffect(() => {
    let alive = true
    void window.clean.getPackages().then((inv) => {
      if (alive && inv) setInventory(inv)
    })
    return () => {
      alive = false
    }
  }, [])

  const run = useCallback(async (force: boolean): Promise<void> => {
    setComputing(true)
    try {
      setInventory(await window.clean.computePackages(force))
    } finally {
      setComputing(false)
    }
  }, [])

  const ensure = useCallback((): void => {
    if (started.current) return
    started.current = true
    void run(false)
  }, [run])

  const refresh = useCallback((): Promise<void> => run(true), [run])

  return { inventory, computing, ensure, refresh }
}
