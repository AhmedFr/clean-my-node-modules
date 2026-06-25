import type { PackageEntry } from '@shared/package.types'

export interface PackageRowProps {
  entry: PackageEntry
  /** Keyboard-selected row. */
  selected?: boolean
  /** Hide latest/advisory columns when registry checks are disabled. */
  showUpdates?: boolean
  /** Select this row (click). */
  onSelect?: () => void
  /** Open the package's npm page. */
  onOpen?: () => void
}
