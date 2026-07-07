import type { DockerActionResult, DockerInfo } from '@shared/docker.types'

export interface DockerViewProps {
  info: DockerInfo | null
  loading: boolean
  /** Search text from the shared header input; filters rows by name. */
  query: string
  onRefresh: () => void
  /** Index of the keyboard-selected row. Unused in Phase A (read-only). */
  selectedIndex?: number
  onSelectIndex?: (i: number) => void
  /** Phase B actions — unused in Phase A. */
  onRemove?: (id: string) => Promise<DockerActionResult | null>
  onPrune?: () => Promise<DockerActionResult | null>
}
