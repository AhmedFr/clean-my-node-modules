import type { PackageEntry, PackageUsage } from '@shared/package.types'
import semver from 'semver'
import type { NamedUsage } from './read-manifest'

/** Orders version strings ascending, semver-aware, tolerating ranges via coercion. */
export function compareVersions(a: string, b: string): number {
  const ca = semver.coerce(a)
  const cb = semver.coerce(b)
  if (ca && cb) return semver.compare(ca, cb)
  return a.localeCompare(b)
}

/**
 * Folds per-project usages into one PackageEntry per package name. projectCount
 * is the number of distinct projects; versions are the distinct in-use versions,
 * sorted ascending. Entries are returned sorted by reach (projectCount desc, then name).
 */
export function aggregatePackages(named: NamedUsage[]): PackageEntry[] {
  const byName = new Map<string, PackageUsage[]>()
  for (const { name, usage } of named) {
    const list = byName.get(name)
    if (list) list.push(usage)
    else byName.set(name, [usage])
  }

  const entries: PackageEntry[] = []
  for (const [name, usages] of byName) {
    const projectCount = new Set(usages.map((u) => u.projectId)).size
    const versions = [...new Set(usages.map((u) => u.version))].sort(compareVersions)
    entries.push({ name, usages, projectCount, versions, multipleVersions: versions.length > 1 })
  }

  return entries.sort((a, b) => b.projectCount - a.projectCount || a.name.localeCompare(b.name))
}
