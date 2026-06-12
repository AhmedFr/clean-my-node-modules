import type { ReactNode } from 'react'
import { FRAMEWORKS } from './FrameworkIcon.constants'
import type { FrameworkIconProps } from './FrameworkIcon.types'

export function FrameworkIcon({ kind, size = 30, radius = 8 }: FrameworkIconProps): ReactNode {
  const fw = FRAMEWORKS[kind] || FRAMEWORKS.node
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: 'block', flex: '0 0 auto' }}
      aria-hidden="true"
    >
      <rect x="0" y="0" width="24" height="24" rx={(radius / size) * 24} fill={fw.bg} />
      {fw.mark(fw.fg)}
    </svg>
  )
}
