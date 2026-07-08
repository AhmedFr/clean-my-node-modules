import type { LiveInfo } from '@shared/liveness.types'
import type { Project } from '@shared/project.types'

export interface MiniRowProps {
  p: Project
  accent: string
  deleting: boolean
  live?: LiveInfo
  onDelete: () => void
  onReveal: () => void
}
