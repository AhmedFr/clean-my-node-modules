import { useCallback, useEffect, useState } from 'react'
import type { PnpmPruneResult, PnpmStoreInfo } from '@shared/pnpm-store.types'

interface UsePnpmStore {
  store: PnpmStoreInfo | null
  pruning: boolean
  prune: () => Promise<PnpmPruneResult | null>
}

/** Global pnpm store size + prune action, synced with the main process. */
export function usePnpmStore(): UsePnpmStore {
  const [store, setStore] = useState<PnpmStoreInfo | null>(null)
  const [pruning, setPruning] = useState(false)

  useEffect(() => {
    let alive = true
    void window.clean.getPnpmStore().then((info) => {
      if (alive) setStore(info)
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

  return { store, pruning, prune }
}
