import type { ReactNode } from 'react'
import type { FrameworkKind } from '@shared/project.types'

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
