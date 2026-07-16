import type { DockerInfo, DockerItem, DockerPruneTarget } from '@shared/docker.types'
import type { Density, SizeStyle } from '@shared/settings.types'
import type { DockerSortKey, DockerTypeFilter } from './DockerView.constants'

export interface DockerViewProps {
  info: DockerInfo | null
  loading: boolean
  /** Search text from the shared header input; filters rows by name. */
  query: string
  /** Group/row sort order. Defaults to 'size' until the toolbar (Task 5) supplies it. */
  sortBy?: DockerSortKey
  /** Item-kind filter. No UI control for this anymore (chips were removed); defaults to 'all'. */
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
  /** Row density/size-display prefs, mirrored from settings so Docker rows match the node_modules list. */
  density: Density
  sizeStyle: SizeStyle
  accent: string
  /** Largest sizeBytes among the items the Docker tab actually renders (build cache excluded,
   *  min 1), for SizeViz's bar scale. */
  maxBytes: number
}
