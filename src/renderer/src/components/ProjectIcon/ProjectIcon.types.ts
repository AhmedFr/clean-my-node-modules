import type { Project } from '@shared/project.types'

export interface ProjectIconProps {
  p: Pick<Project, 'kind' | 'iconDataUrl' | 'name'>
  size?: number
  radius?: number
}
