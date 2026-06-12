/** State of the global pnpm content-addressable store. */
export interface PnpmStoreInfo {
  /** false when pnpm isn't installed or the store path can't be resolved */
  available: boolean
  path: string | null
  /** path with the home dir abbreviated to ~ */
  displayPath: string
  sizeBytes: number
  checkedAt: number
}

export interface PnpmPruneResult {
  ok: boolean
  freedBytes: number
}
