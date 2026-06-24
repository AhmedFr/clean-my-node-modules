import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Well-known pnpm store roots, in priority order. The store lives under a
 * `v<N>` subdir of one of these (what `pnpm store path` returns), so we can
 * locate it on disk without running pnpm at all.
 */
export function storeRootCandidates(env: NodeJS.ProcessEnv, home: string): string[] {
  const roots = [
    env.PNPM_HOME ? join(env.PNPM_HOME, 'store') : null,
    join(home, 'Library', 'pnpm', 'store'),
    join(home, '.local', 'share', 'pnpm', 'store'),
    env.XDG_DATA_HOME ? join(env.XDG_DATA_HOME, 'pnpm', 'store') : null,
  ].filter((p): p is string => p !== null)
  return [...new Set(roots)]
}

/** Highest `v<N>` directory name among entries, or null. */
export function newestVersionDir(entries: string[]): string | null {
  const versioned = entries
    .filter((e) => /^v\d+$/.test(e))
    .map((e) => ({ name: e, n: Number.parseInt(e.slice(1), 10) }))
    .sort((a, b) => b.n - a.n)
  return versioned[0]?.name ?? null
}

/** Locates the store dir on disk (newest version under the first existing root). */
export async function inferStoreDir(env: NodeJS.ProcessEnv, home: string): Promise<string | null> {
  for (const root of storeRootCandidates(env, home)) {
    try {
      const newest = newestVersionDir(await readdir(root))
      if (newest) return join(root, newest)
    } catch {
      // root doesn't exist — try the next
    }
  }
  return null
}
