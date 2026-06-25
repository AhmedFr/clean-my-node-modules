import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { nvmNodeBins, versionManagerBinDirs } from './runtime-bins'

/**
 * Candidate pnpm binary locations: an explicit override first, then every
 * runtime bin dir (so an npm-global or corepack pnpm under nvm/volta/asdf is
 * found, not just standalone/Homebrew), then pnpm's standalone install dirs.
 * The app may be launched from Finder without the user's shell PATH, so PATH
 * alone is not enough.
 */
export function pnpmCandidates(
  env: NodeJS.ProcessEnv,
  home: string,
  nvmBins: string[] = [],
  overrideBin?: string,
): string[] {
  const fromBinDirs = versionManagerBinDirs(env, home, nvmBins).map((dir) => join(dir, 'pnpm'))
  const standalone = [join(home, 'Library', 'pnpm', 'pnpm'), join(home, '.local', 'share', 'pnpm', 'pnpm')]
  const all = overrideBin ? [overrideBin, ...fromBinDirs, ...standalone] : [...fromBinDirs, ...standalone]
  return [...new Set(all)]
}

let resolved: string | null | undefined

/**
 * Resolves the pnpm binary; null when pnpm isn't installed. An explicit
 * `overrideBin` (from settings) is tried first and bypasses the per-run cache
 * so changing it in Settings takes effect immediately.
 */
export async function findPnpm(overrideBin?: string): Promise<string | null> {
  if (overrideBin === undefined && resolved !== undefined) return resolved
  const home = homedir()
  const candidates = pnpmCandidates(process.env, home, await nvmNodeBins(home), overrideBin || undefined)
  for (const candidate of candidates) {
    try {
      await access(candidate, constants.X_OK)
      if (overrideBin === undefined) resolved = candidate
      return candidate
    } catch {
      // keep looking
    }
  }
  if (overrideBin === undefined) resolved = null
  return null
}
