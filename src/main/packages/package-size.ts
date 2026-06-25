import { realpath } from 'node:fs/promises'
import { join } from 'node:path'
import type { PackageEntry } from '@shared/package.types'
import { folderSize } from '../lib/folder-size'
import { mapLimit } from '../lib/map-limit'

/** How many packages to size concurrently (each does one `du`). */
const SIZE_CONCURRENCY = 6

/** A function that measures the on-disk size of one installed package, in bytes. */
export type MeasureFn = (projectDir: string, name: string) => Promise<number | null>

/**
 * On-disk size of an installed package, in bytes. Resolves the
 * `node_modules/<name>` symlink to its real directory first, so pnpm's
 * store-backed `.pnpm/<name>@<version>/node_modules/<name>` and npm/yarn's real
 * copies are measured uniformly. Returns null when the package isn't installed.
 */
export const measureInstalledPackage: MeasureFn = async (projectDir, name) => {
  try {
    const real = await realpath(join(projectDir, 'node_modules', name))
    return await folderSize(real)
  } catch {
    return null
  }
}

/**
 * Fills `entry.size` for each package with the largest measured version size.
 * Each distinct resolved version is measured at most once (via the first project
 * using it); unresolved usages (declared ranges) are skipped. Mutates `entries`.
 */
export async function sizeEntries(
  entries: PackageEntry[],
  projectDirById: Map<string, string>,
  measure: MeasureFn = measureInstalledPackage,
  limit = SIZE_CONCURRENCY,
): Promise<void> {
  // Dedup identical name@version across the whole inventory (pnpm shares them).
  const cache = new Map<string, Promise<number | null>>()

  await mapLimit(entries, limit, async (entry) => {
    const seen = new Set<string>()
    let max: number | undefined
    for (const usage of entry.usages) {
      if (usage.unresolved || seen.has(usage.version)) continue
      seen.add(usage.version)
      const dir = projectDirById.get(usage.projectId)
      if (!dir) continue
      const key = `${entry.name}@${usage.version}`
      let pending = cache.get(key)
      if (!pending) {
        pending = measure(dir, entry.name)
        cache.set(key, pending)
      }
      const size = await pending
      if (size != null) max = max === undefined ? size : Math.max(max, size)
    }
    if (max !== undefined) entry.size = max
  })
}
