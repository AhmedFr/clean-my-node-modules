import type { SeverityCounts, SeverityKey } from '@renderer/lib/severity'
import type { SeveritySegment } from './SeverityMeter.types'

/** Worst-first, so the bar reads critical → low left to right. */
export const SEVERITY_ORDER: SeverityKey[] = ['critical', 'high', 'moderate', 'low']

export const SEVERITY_COLORS: Record<SeverityKey, string> = {
  critical: '#ff453a',
  high: '#ff9f0a',
  moderate: '#ffd60a',
  low: '#5e9eff',
}

/** Non-empty severity buckets, in severity order, each with its share of the
 *  vulnerable total. Empty when nothing is vulnerable. */
export function severitySegments(counts: SeverityCounts): SeveritySegment[] {
  if (counts.vulnerable <= 0) return []
  return SEVERITY_ORDER.filter((k) => counts[k] > 0).map((k) => ({
    key: k,
    count: counts[k],
    color: SEVERITY_COLORS[k],
    frac: counts[k] / counts.vulnerable,
  }))
}

/** Full breakdown for the header tooltip (the 132px slot has no room for a legend). */
export function severityMeterTooltip(counts: SeverityCounts, total: number): string {
  return `${counts.critical} critical · ${counts.high} high · ${counts.moderate} moderate · ${counts.low} low · ${counts.outdated} outdated of ${total} packages`
}
