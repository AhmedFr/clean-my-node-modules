import type { DockerInfo, DockerItem, DockerPruneTarget } from '@shared/docker.types'
import type { DockerSortKey, DockerTypeFilter } from './DockerView.constants'

export interface DockerViewProps {
  info: DockerInfo | null
  loading: boolean
  /** Search text from the shared header input; filters rows by name. */
  query: string
  /** Group/row sort order. Defaults to 'size' until the toolbar (Task 5) supplies it. */
  sortBy?: DockerSortKey
  /** Item-kind filter. Defaults to 'all' until the toolbar (Task 5) supplies it. */
  typeFilter?: DockerTypeFilter
  onRefresh: () => void
  /** Index of the keyboard-selected row. Unused for now (docker rows aren't keyboard-navigable yet). */
  selectedIndex?: number
  onSelectIndex?: (i: number) => void
  /** id of the item being removed, or `prune:<target>` while a prune runs; null when idle. */
  busyId?: string | null
  /** Requests removal of a single removable item; caller owns the confirm gate. */
  onRemove?: (item: DockerItem) => void
  /** Requests a bulk prune for a category; caller owns the confirm gate. */
  onPrune?: (target: DockerPruneTarget) => void
}
