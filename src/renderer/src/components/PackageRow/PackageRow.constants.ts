import type { AdvisorySeverity } from '@shared/package.types'

/** Badge/dot colour per advisory severity. */
export const SEVERITY_COLOR: Record<AdvisorySeverity, string> = {
  critical: '#ef4444',
  high: '#f87171',
  moderate: '#fbbf24',
  low: 'var(--text-muted)',
}
