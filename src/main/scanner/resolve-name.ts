import { readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { GENERIC_NAMES, NAME_SEPARATOR } from './resolve-name.constants'

const norm = (s: string): string => s.trim().toLowerCase()

function isGeneric(name: string): boolean {
  return GENERIC_NAMES.has(norm(name))
}

/** "@acme/web-dashboard" → "web-dashboard"; "web" → "web". */
function stripScope(pkgName: string): string {
  const slash = pkgName.lastIndexOf('/')
  return slash >= 0 ? pkgName.slice(slash + 1) : pkgName
}

export interface NameParts {
  /** The node_modules' own folder name (basename of the project dir). */
  folder: string
  /** Nearest git-repo root folder name, if any. */
  repoName?: string | null
  /** Immediate parent folder name. */
  parentName?: string | null
  /** package.json "name" field, if any. */
  pkgName?: string | null
}

/**
 * Pure name chooser. A specific folder name is kept; a generic one is qualified
 * with a meaningful package name, repo root, or parent folder.
 */
export function chooseName({ folder, repoName, parentName, pkgName }: NameParts): string {
  if (!isGeneric(folder)) return folder

  // A meaningful package.json name beats everything (e.g. "web-dashboard").
  const pkg = pkgName ? stripScope(pkgName) : ''
  if (pkg && !isGeneric(pkg) && norm(pkg) !== norm(folder)) return pkg

  // Otherwise qualify with the repo root, then the parent folder.
  const qualifier =
    repoName && norm(repoName) !== norm(folder)
      ? repoName
      : parentName && !isGeneric(parentName) && norm(parentName) !== norm(folder)
        ? parentName
        : null

  return qualifier ? `${qualifier}${NAME_SEPARATOR}${folder}` : folder
}

async function hasGit(dir: string): Promise<boolean> {
  try {
    await stat(join(dir, '.git'))
    return true
  } catch {
    return false
  }
}

/**
 * Nearest ancestor (inclusive) containing a `.git`, not walking above $HOME.
 * Results are memoized per directory in `cache` so monorepo siblings only
 * walk the tree once.
 */
async function findRepoRoot(
  startDir: string,
  cache: Map<string, string | null>,
): Promise<string | null> {
  const stop = homedir()
  const chain: string[] = []
  let dir = startDir
  for (;;) {
    if (cache.has(dir)) {
      const root = cache.get(dir) ?? null
      for (const d of chain) cache.set(d, root)
      return root
    }
    chain.push(dir)
    if (await hasGit(dir)) {
      for (const d of chain) cache.set(d, dir)
      return dir
    }
    const parent = dirname(dir)
    if (dir === stop || parent === dir) {
      for (const d of chain) cache.set(d, null)
      return null
    }
    dir = parent
  }
}

async function readPkgName(projectDir: string): Promise<string | null> {
  try {
    const raw = await readFile(join(projectDir, 'package.json'), 'utf8')
    const name = (JSON.parse(raw) as { name?: unknown }).name
    return typeof name === 'string' && name.trim() ? name.trim() : null
  } catch {
    return null
  }
}

/**
 * Best display name for the project at `projectDir`. Cheap for specific folder
 * names; only reads the repo root / package.json when the folder is generic.
 */
export async function resolveProjectName(
  projectDir: string,
  cache: Map<string, string | null>,
): Promise<string> {
  const folder = basename(projectDir)
  if (!isGeneric(folder)) return folder

  const [repoRoot, pkgName] = await Promise.all([findRepoRoot(projectDir, cache), readPkgName(projectDir)])
  return chooseName({
    folder,
    repoName: repoRoot ? basename(repoRoot) : null,
    parentName: basename(dirname(projectDir)),
    pkgName,
  })
}
