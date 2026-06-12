import type { IconRenderer } from '@renderer/components/UIIcon'

export interface MItemProps {
  icon?: IconRenderer
  label: string
  shortcut?: string
  danger?: boolean
  onClick?: () => void
}
