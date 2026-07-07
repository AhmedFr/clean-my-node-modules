import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { pnpmExecEnv } from '../pnpm-store/find-node'
import { nvmNodeBins, versionManagerBinDirs } from '../pnpm-store/runtime-bins'

/** Finder-launched apps get a minimal PATH; reuse the pnpm spawn env (real PATH). */
export const dockerExecEnv = pnpmExecEnv

/**
 * Candidate docker binary locations: an explicit override first, then every
 * runtime bin dir, then the standard Docker Desktop / Homebrew / /usr/local
 * install paths. Deduped, order-preserving.
 */
export function dockerCandidates(
  env: NodeJS.ProcessEnv,
  home: string,
  nvmBins: string[] = [],
  overrideBin?: string,
): string[] {
  const fromBinDirs = versionManagerBinDirs(env, home, nvmBins).map((dir) => join(dir, 'docker'))
  const standard = [
    '/usr/local/bin/docker',
    '/opt/homebrew/bin/docker',
    '/Applications/Docker.app/Contents/Resources/bin/docker',
  ]
  const all = overrideBin ? [overrideBin, ...fromBinDirs, ...standard] : [...fromBinDirs, ...standard]
  return [...new Set(all)]
}

let resolved: string | null | undefined

/** Resolves the docker binary; null when not installed. Override bypasses the cache. */
export async function findDocker(overrideBin?: string): Promise<string | null> {
  if (overrideBin === undefined && resolved !== undefined) return resolved
  const home = homedir()
  const candidates = dockerCandidates(process.env, home, await nvmNodeBins(home), overrideBin || undefined)
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
