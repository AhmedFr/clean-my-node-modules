import { execFile } from 'node:child_process'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/** Parses `du -sk` output ("123456\t/path") into bytes. */
export function parseDuKb(stdout: string): number {
  const kb = parseInt(stdout.trim().split(/\s+/)[0], 10)
  return Number.isFinite(kb) ? kb * 1024 : 0
}

/** Folder size in bytes via `du -sk` (fast, native). */
export async function folderSize(path: string): Promise<number> {
  const { stdout } = await execFileAsync('du', ['-sk', path], {
    maxBuffer: 1024 * 1024,
  })
  return parseDuKb(stdout)
}

/** Apparent vs unique disk usage of a node_modules folder. */
export interface NodeModulesSize {
  /** Total size on disk (≈ what `du` / Finder show). */
  apparent: number
  /** Bytes freed by deleting this folder now: apparent minus the store-backed `.pnpm` subtree. */
  unique: number
}

/**
 * Measures a node_modules folder, separating the project's own content from the
 * pnpm-store-backed `.pnpm` subtree. On macOS APFS pnpm clones package files from
 * the global store (copy-on-write, indistinguishable from real copies via stat), so
 * the structural `.pnpm` boundary — not link counts — is the reliable signal for what
 * is shared with the store and therefore not reclaimed by deleting this folder alone.
 */
export async function measureNodeModules(nmPath: string): Promise<NodeModulesSize> {
  const [apparent, shared] = await Promise.all([folderSize(nmPath), pnpmStoreBackedSize(join(nmPath, '.pnpm'))])
  return { apparent, unique: Math.max(0, apparent - shared) }
}

/** Size of the `.pnpm` subtree, or 0 when this folder is not pnpm-managed. */
async function pnpmStoreBackedSize(pnpmDir: string): Promise<number> {
  try {
    if (!(await stat(pnpmDir)).isDirectory()) return 0
  } catch {
    return 0
  }
  return folderSize(pnpmDir)
}
