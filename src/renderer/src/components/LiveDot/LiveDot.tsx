import type { ReactNode } from 'react'
import type { LiveDotProps } from './LiveDot.types'

/** Small green dot marking a project whose app is currently running. */
export function LiveDot({ info }: LiveDotProps): ReactNode {
  const label = `Running · ${info.command}${info.port ? ` · :${info.port}` : ''}`
  return (
    <span
      role="img"
      title={label}
      aria-label={label}
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: '#35c759',
        boxShadow: '0 0 0 3px rgba(53,199,89,0.18)',
        flexShrink: 0,
      }}
    />
  )
}
