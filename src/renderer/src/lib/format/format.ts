import { GB, MB } from '@shared/units.constants'

export { GB, MB }

export const DAY = 86400000

export interface FormattedSize {
  value: string
  unit: 'GB' | 'MB' | 'KB'
}

export function formatSize(bytes: number): FormattedSize {
  if (bytes >= GB) return { value: (bytes / GB).toFixed(2), unit: 'GB' }
  if (bytes >= MB) return { value: Math.round(bytes / MB).toString(), unit: 'MB' }
  return { value: Math.max(1, Math.round(bytes / 1024)).toString(), unit: 'KB' }
}

export function formatSizeStr(bytes: number): string {
  const s = formatSize(bytes)
  return `${s.value} ${s.unit}`
}

export function relativeTime(ts: number, now = Date.now()): string {
  const days = Math.floor((now - ts) / DAY)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) {
    const w = Math.round(days / 7)
    return `${w} week${w > 1 ? 's' : ''} ago`
  }
  if (days < 365) {
    const m = Math.round(days / 30)
    return `${m} month${m > 1 ? 's' : ''} ago`
  }
  const y = days / 365
  const yr = y < 1.5 ? 1 : Math.round(y)
  return `${yr} year${yr > 1 ? 's' : ''} ago`
}

/** Staleness 0..1 (older = closer to 1), capped at ~18 months. */
export function staleness(ts: number, now = Date.now()): number {
  const days = (now - ts) / DAY
  return Math.max(0, Math.min(1, days / 540))
}
