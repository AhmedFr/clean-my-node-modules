/** A mounted external volume offered as a scan-location toggle. */
export interface VolumeOption {
  path: string
  name: string
  /** True when this volume's path is already in Settings.scanRoots. */
  included: boolean
}
