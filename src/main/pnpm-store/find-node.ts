import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'
import { nvmNodeBins, versionManagerBinDirs } from './runtime-bins'

/**
 * Candidate `node` binary locations, PATH first, then well-known installs.
 *
 * Homebrew's pnpm is a `#!/usr/bin/env node` script, so running it needs
 * `node` on PATH. A Finder-launched app only inherits the minimal launchd
 * PATH, which usually has neither a version-manager node (nvm/volta/asdf)
 * nor Homebrew's bin — so PATH alone is not enough.
 *
 * `nvmBins` is the list of nvm version `bin` dirs (newest first); it is passed
 * in so the pure candidate ordering stays testable.
 */
export function nodeCandidates(env: NodeJS.ProcessEnv, home: string, nvmBins: string[] = []): string[] {
  return versionManagerBinDirs(env, home, nvmBins).map((dir) => join(dir, 'node'))
}

let resolved: string | null | undefined

/** Resolves a usable node binary once per app run; null when none is found. */
export async function findNode(): Promise<string | null> {
  if (resolved !== undefined) return resolved
  const home = homedir()
  const candidates = nodeCandidates(process.env, home, await nvmNodeBins(home))
  for (const candidate of candidates) {
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

/**
 * Process env for spawning pnpm, with a resolved node's directory prepended to
 * PATH so the pnpm shebang can find node even under a bare launchd PATH.
 * Falls back to the unmodified env when no node is found.
 */
export async function pnpmExecEnv(): Promise<NodeJS.ProcessEnv> {
  const node = await findNode()
  if (!node) return process.env
  const PATH = [dirname(node), process.env.PATH ?? ''].filter(Boolean).join(delimiter)
  return { ...process.env, PATH }
}
