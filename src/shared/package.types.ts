/** Computer-wide installed-package inventory, shared between main and renderer. */

/** One project's use of a package: the resolved (or declared, when not installed) version. */
export interface PackageUsage {
  projectId: string
  projectName: string
  /** Resolved installed version, or the declared range when not resolvable. */
  version: string
  /** True when this version could not be resolved from node_modules (declared range). */
  unresolved?: boolean
  /** From devDependencies rather than dependencies. */
  dev: boolean
}

export type AdvisorySeverity = 'low' | 'moderate' | 'high' | 'critical'

/** Worst security advisory affecting an in-use version of a package. */
export interface PackageAdvisory {
  severity: AdvisorySeverity
  title: string
  url?: string
  /** semver range the advisory applies to (e.g. "<4.17.21"). */
  vulnerableVersions: string
}

/** One package aggregated across every project that directly depends on it. */
export interface PackageEntry {
  name: string
  usages: PackageUsage[]
  /** Number of projects that directly depend on this package. */
  projectCount: number
  /** Distinct in-use versions, sorted (ascending). */
  versions: string[]
  /** More than one version in use — a unify opportunity. */
  multipleVersions: boolean
  /** Largest unique-version size in bytes, measured from the store; undefined when unknown. */
  size?: number
  /** Registry dist-tag `latest`; undefined when enrichment was skipped or failed. */
  latest?: string
  /** True when any in-use version is behind `latest` (semver). */
  outdated?: boolean
  /** Worst-severity advisory hitting an in-use version, if any. */
  advisory?: PackageAdvisory
}

/** The full inventory, persisted to disk and surfaced over IPC. */
export interface PackageInventory {
  packages: PackageEntry[]
  /** ms epoch the local (enumerate + size) pass finished. */
  computedAt: number
  /** Number of projects scanned for direct dependencies. */
  projectCount: number
  /** Set when registry enrichment failed (offline / rate-limited); local data is still present. */
  enrichmentError?: string
}
