import type { PackageEntry } from '@shared/package.types'

export interface PackageRowProps {
  entry: PackageEntry
  /** Keyboard-selected row. */
  selected?: boolean
  /** The detail panel for this row is open. */
  expanded?: boolean
  /** Hide latest/advisory columns when registry checks are disabled. */
  showUpdates?: boolean
  /** Move selection to this row (hover). */
  onSelect?: () => void
  /** Toggle the detail panel (click). */
  onToggle?: () => void
  /** Registers the row element so the list can position its sliding highlight. */
  rowRef?: (el: HTMLDivElement | null) => void
}
