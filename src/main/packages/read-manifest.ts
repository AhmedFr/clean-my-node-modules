import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PackageUsage } from '@shared/package.types'
import type { Project } from '@shared/project.types'

/** A package declared directly in a project's package.json. */
export interface DirectDep {
  name: string
  range: string
  dev: boolean
}

/** One project's direct use of a package, paired with the package name. */
export interface NamedUsage {
  name: string
  usage: PackageUsage
}

interface ManifestShape {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

/**
 * Pure: direct deps (prod + dev) from a parsed package.json. A name present in
 * both is treated as a production dependency (prod wins the clash).
 */
export function directDepsFromManifest(pkg: ManifestShape): DirectDep[] {
  const byName = new Map<string, DirectDep>()
  for (const [name, range] of Object.entries(pkg.devDependencies ?? {})) byName.set(name, { name, range, dev: true })
  for (const [name, range] of Object.entries(pkg.dependencies ?? {})) byName.set(name, { name, range, dev: false })
  return [...byName.values()]
}

/** Reads & parses a project's direct deps; [] on a missing/malformed manifest. */
export async function readDirectDeps(projectDir: string): Promise<DirectDep[]> {
  try {
    const raw = await readFile(join(projectDir, 'package.json'), 'utf8')
    return directDepsFromManifest(JSON.parse(raw) as ManifestShape)
  } catch {
    return []
  }
}

/**
 * Resolved installed version from `node_modules/<name>/package.json`, or null.
 * fs reads follow pnpm symlinks transparently, so this works for pnpm, npm and yarn.
 */
export async function resolveInstalledVersion(projectDir: string, name: string): Promise<string | null> {
  try {
    const raw = await readFile(join(projectDir, 'node_modules', name, 'package.json'), 'utf8')
    const version = (JSON.parse(raw) as { version?: string }).version
    return typeof version === 'string' ? version : null
  } catch {
    return null
  }
}

/**
 * All direct-dependency usages for one project, each with the resolved installed
 * version (or the declared range, flagged `unresolved`, when not installed).
 */
export async function readProjectPackages(project: Pick<Project, 'id' | 'name' | 'absPath'>): Promise<NamedUsage[]> {
  const deps = await readDirectDeps(project.absPath)
  return Promise.all(
    deps.map(async (dep): Promise<NamedUsage> => {
      const resolved = await resolveInstalledVersion(project.absPath, dep.name)
      return {
        name: dep.name,
        usage: {
          projectId: project.id,
          projectName: project.name,
          version: resolved ?? dep.range,
          ...(resolved === null ? { unresolved: true } : {}),
          dev: dep.dev,
        },
      }
    }),
  )
}
