import type { CSSProperties, ReactNode } from 'react'

export interface IconProps {
  size?: number
  stroke?: number
  fill?: string
  style?: CSSProperties
}

export type IconRenderer = (props?: IconProps) => ReactNode

export type UIIconName =
  | 'search'
  | 'trash'
  | 'folder'
  | 'finder'
  | 'gear'
  | 'refresh'
  | 'chevronRight'
  | 'chevronLeft'
  | 'check'
  | 'checkCircle'
  | 'clock'
  | 'alert'
  | 'sparkle'
  | 'command'
  | 'arrowUp'
  | 'arrowDown'
  | 'enter'
  | 'x'
  | 'hdd'
  | 'power'
  | 'box'
  | 'externalLink'
