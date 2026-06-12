import type { Project } from '@shared/project.types'

export interface MiniRowProps {
  p: Project
  accent: string
  deleting: boolean
  onDelete: () => void
  onReveal: () => void
}
