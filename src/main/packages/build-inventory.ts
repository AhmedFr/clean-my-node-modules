import type { PackageInventory } from '@shared/package.types'
import type { Project } from '@shared/project.types'
import type { Settings } from '@shared/settings.types'
import { mapLimit } from '../lib/map-limit'
import { aggregatePackages } from './aggregate'
import { sizeEntries } from './package-size'
import { readProjectPackages } from './read-manifest'
import { enrichEntries, type RegistryClient } from './registry'

/** How many project manifests to read concurrently. */
const READ_CONCURRENCY = 8

/** Lazily build the real client so unit tests never import Electron. */
async function defaultClient(): Promise<RegistryClient> {
  const { createRegistryClient } = await import('./registry-client')
  return createRegistryClient()
}

/**
 * Builds the computer-wide package inventory from already-scanned projects:
 * enumerate direct deps + resolved versions, aggregate by name, size each unique
 * version from disk, then (optionally) enrich with registry latest + advisories.
 * Local data always lands; registry failures only set `enrichmentError`.
 */
export async function buildInventory(
  projects: Project[],
  settings: Pick<Settings, 'checkUpdates'>,
  makeClient: () => RegistryClient | Promise<RegistryClient> = defaultClient,
): Promise<PackageInventory> {
  const perProject = await mapLimit(projects, READ_CONCURRENCY, (p) => readProjectPackages(p))
  const packages = aggregatePackages(perProject.flat())

  const dirById = new Map(projects.map((p) => [p.id, p.absPath]))
  await sizeEntries(packages, dirById)

  const inventory: PackageInventory = { packages, computedAt: Date.now(), projectCount: projects.length }

  if (settings.checkUpdates && packages.length > 0) {
    const { enrichmentError } = await enrichEntries(packages, await makeClient())
    if (enrichmentError) inventory.enrichmentError = enrichmentError
  }

  return inventory
}
