import { readdir } from 'node:fs/promises'
import { delimiter, join } from 'node:path'

/**
 * Ordered, deduped bin directories where a JS runtime or its globally-installed
 * tools live: PATH first (a Finder launch has a minimal one), then the version
 * managers and package locations a GUI app does not inherit.
 *
 * `nvmBins` is passed in (newest first) so ordering stays pure and testable.
 */
export function versionManagerBinDirs(env: NodeJS.ProcessEnv, home: string, nvmBins: string[]): string[] {
  const fromPath = (env.PATH ?? '').split(delimiter).filter(Boolean)
  const wellKnown = [
    env.PNPM_HOME ?? null,
    ...nvmBins,
    join(home, '.volta', 'bin'),
    join(home, '.asdf', 'shims'),
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/usr/bin',
  ].filter((d): d is string => d !== null)
  return [...new Set([...fromPath, ...wellKnown])]
}

/** nvm keeps each version under ~/.nvm/versions/node/<v>/bin; newest first. */
export async function nvmNodeBins(home: string): Promise<string[]> {
  const base = join(home, '.nvm', 'versions', 'node')
  try {
    const versions = await readdir(base)
    return versions
      .sort()
      .reverse()
      .map((v) => join(base, v, 'bin'))
  } catch {
    return []
  }
}
