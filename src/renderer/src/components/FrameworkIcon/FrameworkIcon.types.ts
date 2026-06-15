import type { FrameworkKind } from '@shared/project.types'
import type { ReactNode } from 'react'

export interface FrameworkSpec {
  bg: string
  fg: string
  mark: (color: string) => ReactNode
}

export interface FrameworkIconProps {
  kind: FrameworkKind
  size?: number
  radius?: number
}
