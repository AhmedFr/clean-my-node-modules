import type { AdvisorySeverity, PackageEntry } from '@shared/package.types'

export type SeverityKey = AdvisorySeverity

export interface SeverityCounts {
  critical: number
  high: number
  moderate: number
  low: number
  /** critical + high + moderate + low */
  vulnerable: number
  outdated: number
}

/** Tally packages by their worst-advisory severity (already stored on the entry),
 *  plus a separate count of packages behind `latest`. A package with no advisory
 *  contributes to no severity bucket; `outdated` is independent of advisories. */
export function severityCounts(packages: PackageEntry[]): SeverityCounts {
  const c: SeverityCounts = { critical: 0, high: 0, moderate: 0, low: 0, vulnerable: 0, outdated: 0 }
  for (const p of packages) {
    const sev = p.advisory?.severity
    if (sev) {
      c[sev] += 1
      c.vulnerable += 1
    }
    if (p.outdated) c.outdated += 1
  }
  return c
}
