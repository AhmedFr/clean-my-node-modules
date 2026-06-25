import type { PackageEntry } from '@shared/package.types'

export interface PackageRowProps {
  entry: PackageEntry
  /** Keyboard-selected row. */
  selected?: boolean
  /** Hide latest/advisory columns when registry checks are disabled. */
  showUpdates?: boolean
  /** Select this row (hover / click). */
  onSelect?: () => void
  /** Open the package's npm page. */
  onOpen?: () => void
  /** Registers the row element so the list can position its sliding highlight. */
  rowRef?: (el: HTMLDivElement | null) => void
}
