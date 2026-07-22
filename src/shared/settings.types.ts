export type ScanInterval = '6h' | 'daily' | 'weekly' | 'manual'
export type SizeStyle = 'plain' | 'bar' | 'ring'
export type Density = 'compact' | 'roomy'

export interface Settings {
  accent: string
  sizeStyle: SizeStyle
  density: Density
  thresholdGB: number
  /** pnpm cache (store) size limit, GB — headline gauge on the Caches tab. */
  cacheThresholdGB: number
  /** Docker total size limit, GB — headline gauge on the Docker tab. */
  dockerThresholdGB: number
  scanInterval: ScanInterval
  notify: boolean
  onboarded: boolean
  /** Query npm for latest versions + security advisories in the Packages tab. */
  checkUpdates: boolean
  analytics: boolean
  /** Manual override: path to the pnpm content-addressable store dir. */
  pnpmStorePath?: string
  /** Manual override: path to the pnpm executable. */
  pnpmBinaryPath?: string
  /** Extra scan roots opted in by the user (absolute paths): toggled external
   *  volumes and arbitrary "Add folder…" paths. Home is implicit, never stored. */
  scanRoots: string[]
  /** Show the Docker tab and allow Docker cleanup. */
  docker?: boolean
  /** Manual override: path to the docker executable. */
  dockerBinaryPath?: string
  /** Update banner dismissed for this version; a newer release re-shows the banner. */
  dismissedUpdateVersion?: string
}
