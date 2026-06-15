import type { IconRenderer } from '@renderer/components/UIIcon'
import type { Project } from '@shared/project.types'
import type { Density, SizeStyle } from '@shared/settings.types'

export interface RowProps {
  p: Project
  selected: boolean
  density: Density
  sizeStyle: SizeStyle
  maxBytes: number
  accent: string
  deleting: boolean
  rowRef: (el: HTMLDivElement | null) => void
  onSelect: () => void
  onOpen: () => void
  onFinder: () => void
  onDelete: () => void
}

export interface RowActionProps {
  icon: IconRenderer
  label: string
  danger?: boolean
  onClick: () => void
}
