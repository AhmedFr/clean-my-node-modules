import type { ReactNode } from 'react'
import type { SpinnerProps } from './Spinner.types'

/** A small spinning ring for inline loading states. */
export function Spinner({ size = 12, color = 'var(--text-muted)' }: SpinnerProps): ReactNode {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1.5px solid var(--surface-3)',
        borderTopColor: color,
        animation: 'ccspin 0.7s linear infinite',
        flex: 'none',
        display: 'inline-block',
      }}
    />
  )
}
