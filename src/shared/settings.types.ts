export type ScanInterval = '6h' | 'daily' | 'weekly' | 'manual'
export type SizeStyle = 'plain' | 'bar' | 'ring'
export type Density = 'compact' | 'roomy'

export interface Settings {
  accent: string
  sizeStyle: SizeStyle
  density: Density
  thresholdGB: number
  scanInterval: ScanInterval
  notify: boolean
  onboarded: boolean
  /** Manual override: path to the pnpm content-addressable store dir. */
  pnpmStorePath?: string
  /** Manual override: path to the pnpm executable. */
  pnpmBinaryPath?: string
}
