import type { PnpmPruneResult, PnpmStoreInfo } from '@shared/pnpm-store.types'
import { useCallback, useEffect, useState } from 'react'

interface UsePnpmStore {
  store: PnpmStoreInfo | null
  /** True until the store size has been measured at least once (du can take seconds). */
  loading: boolean
  pruning: boolean
  prune: () => Promise<PnpmPruneResult | null>
  refresh: () => Promise<void>
}

/** Global pnpm store size + prune action, synced with the main process. */
export function usePnpmStore(): UsePnpmStore {
  const [store, setStore] = useState<PnpmStoreInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [pruning, setPruning] = useState(false)

  useEffect(() => {
    let alive = true
    void window.clean.getPnpmStore().then((info) => {
      if (alive) {
        setStore(info)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  const prune = useCallback(async (): Promise<PnpmPruneResult | null> => {
    setPruning(true)
    try {
      const result = await window.clean.prunePnpmStore()
      setStore(await window.clean.getPnpmStore())
      return result
    } catch {
      return null
    } finally {
      setPruning(false)
    }
  }, [])

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      setStore(await window.clean.getPnpmStore(true))
    } finally {
      setLoading(false)
    }
  }, [])

  return { store, loading, pruning, prune, refresh }
}
