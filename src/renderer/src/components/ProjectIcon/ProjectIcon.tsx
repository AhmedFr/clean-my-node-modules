import { useState, type ReactNode } from 'react'
import { FrameworkIcon } from '@renderer/components/FrameworkIcon'
import type { ProjectIconProps } from './ProjectIcon.types'

/** The project's own favicon/logo when available; framework icon otherwise. */
export function ProjectIcon({ p, size = 30, radius = 8 }: ProjectIconProps): ReactNode {
  const [failed, setFailed] = useState(false)

  if (!p.iconDataUrl || failed) {
    return <FrameworkIcon kind={p.kind} size={size} radius={radius} />
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flex: '0 0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-1)',
        boxShadow: 'inset 0 0 0 1px var(--hairline)',
        overflow: 'hidden',
      }}
    >
      <img
        src={p.iconDataUrl}
        alt=""
        aria-hidden="true"
        onError={() => setFailed(true)}
        style={{ width: size * 0.72, height: size * 0.72, objectFit: 'contain', display: 'block' }}
      />
    </div>
  )
}
