import type { AdvisorySeverity, PackageAdvisory, PackageEntry } from '@shared/package.types'
import semver from 'semver'
import { mapLimit } from '../lib/map-limit'

/** How many `latest` lookups to run concurrently. */
const LATEST_CONCURRENCY = 10

/** A security advisory as returned by npm's bulk advisories endpoint. */
export interface RawAdvisory {
  title: string
  severity: AdvisorySeverity
  vulnerable_versions: string
  url?: string
}

/** Pluggable registry access, so the orchestrator can be tested without network. */
export interface RegistryClient {
  /** dist-tag `latest` for a package, or null when unknown / not found. */
  fetchLatest(name: string): Promise<string | null>
  /** Advisories for a `{ name: versions[] }` map, keyed by package name. */
  fetchAdvisories(versionsByName: Record<string, string[]>): Promise<Record<string, RawAdvisory[]>>
}

const SEVERITY_RANK: Record<AdvisorySeverity, number> = { low: 1, moderate: 2, high: 3, critical: 4 }

/** True when any of `versions` is strictly behind `latest` (semver, range-tolerant). */
export function isOutdated(versions: string[], latest: string): boolean {
  const target = semver.coerce(latest)
  if (!target) return false
  return versions.some((v) => {
    const current = semver.coerce(v)
    return current ? semver.lt(current, target) : false
  })
}

/** Resolved (installed) in-use versions of an entry; falls back to all versions. */
function inUseVersions(entry: PackageEntry): string[] {
  const resolved = entry.usages.filter((u) => !u.unresolved).map((u) => u.version)
  return resolved.length > 0 ? [...new Set(resolved)] : entry.versions
}

/**
 * The most severe advisory whose vulnerable range is satisfied by at least one
 * in-use version, or undefined when none apply.
 */
export function pickWorstAdvisory(advisories: RawAdvisory[], versions: string[]): PackageAdvisory | undefined {
  let worst: RawAdvisory | undefined
  for (const adv of advisories) {
    const hits = versions.some((v) => {
      const coerced = semver.coerce(v)
      return coerced ? semver.satisfies(coerced, adv.vulnerable_versions, { includePrerelease: true }) : false
    })
    if (!hits) continue
    if (!worst || SEVERITY_RANK[adv.severity] > SEVERITY_RANK[worst.severity]) worst = adv
  }
  if (!worst) return undefined
  return { severity: worst.severity, title: worst.title, url: worst.url, vulnerableVersions: worst.vulnerable_versions }
}

/**
 * Enriches entries in place with `latest`, `outdated` and `advisory` from the
 * registry. On any network failure it returns an `enrichmentError` and leaves
 * the already-computed local data (sizes, usage counts) untouched.
 */
export async function enrichEntries(
  entries: PackageEntry[],
  client: RegistryClient,
  limit = LATEST_CONCURRENCY,
): Promise<{ enrichmentError?: string }> {
  try {
    await mapLimit(entries, limit, async (entry) => {
      const latest = await client.fetchLatest(entry.name)
      if (latest) {
        entry.latest = latest
        entry.outdated = isOutdated(inUseVersions(entry), latest)
      }
    })

    const versionsByName: Record<string, string[]> = {}
    for (const entry of entries) versionsByName[entry.name] = inUseVersions(entry)
    const advisories = await client.fetchAdvisories(versionsByName)
    for (const entry of entries) {
      const list = advisories[entry.name] ?? []
      const versions = inUseVersions(entry)
      const worst = pickWorstAdvisory(list, versions)
      if (worst) entry.advisory = worst
      const byVersion: Record<string, PackageAdvisory> = {}
      for (const version of versions) {
        const advisory = pickWorstAdvisory(list, [version])
        if (advisory) byVersion[version] = advisory
      }
      if (Object.keys(byVersion).length > 0) entry.advisoriesByVersion = byVersion
    }
    return {}
  } catch (err) {
    return { enrichmentError: (err as Error).message || 'registry unavailable' }
  }
}
