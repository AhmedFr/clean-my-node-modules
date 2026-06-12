import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { delimiter, join } from 'node:path'

/**
 * Candidate pnpm binary locations, PATH first, then well-known installs.
 * The app may be launched from Finder without the user's shell PATH,
 * so PATH alone is not enough.
 */
export function pnpmCandidates(env: NodeJS.ProcessEnv, home: string): string[] {
  const fromPath = (env.PATH ?? '')
    .split(delimiter)
    .filter(Boolean)
    .map((dir) => join(dir, 'pnpm'))
  const wellKnown = [
    env.PNPM_HOME ? join(env.PNPM_HOME, 'pnpm') : null,
    join(home, 'Library', 'pnpm', 'pnpm'),
    join(home, '.local', 'share', 'pnpm', 'pnpm'),
    '/opt/homebrew/bin/pnpm',
    '/usr/local/bin/pnpm',
  ].filter((p): p is string => p !== null)
  return [...new Set([...fromPath, ...wellKnown])]
}

let resolved: string | null | undefined

/** Resolves the pnpm binary once per app run; null when pnpm isn't installed. */
export async function findPnpm(): Promise<string | null> {
  if (resolved !== undefined) return resolved
  for (const candidate of pnpmCandidates(process.env, homedir())) {
    try {
      await access(candidate, constants.X_OK)
      resolved = candidate
      return resolved
    } catch {
      // keep looking
    }
  }
  resolved = null
  return resolved
}
