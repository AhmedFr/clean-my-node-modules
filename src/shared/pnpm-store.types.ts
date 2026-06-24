/** How the store path was resolved. */
export type PnpmStoreSource = 'manual' | 'pnpm' | 'inferred' | 'none'

/** State of the global pnpm content-addressable store. */
export interface PnpmStoreInfo {
  /** false when no store path could be resolved by any method */
  available: boolean
  path: string | null
  /** path with the home dir abbreviated to ~ */
  displayPath: string
  sizeBytes: number
  checkedAt: number
  /** how the path was resolved (or 'none' when unavailable) */
  source: PnpmStoreSource
  /** true only when a pnpm binary was found that we can run `store prune` with */
  canPrune: boolean
  /** human-readable explanation of the current state, for the UI */
  reason?: string
}

export interface PnpmPruneResult {
  ok: boolean
  freedBytes: number
}
