import { createHash } from 'node:crypto'
import { readdir, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { Project, ScanProgress } from '@shared/project.types'
import { abbreviateHome } from '../lib/abbreviate-home'
import { folderSize } from '../lib/folder-size'
import { detectKind } from './detect-kind'
import { findProjectIcon } from './find-project-icon'
import { resolveProjectName } from './resolve-name'
import {
  MAX_SCAN_DEPTH,
  PROGRESS_THROTTLE_MS,
  SIZE_CONCURRENCY,
  SKIPPED_DIR_NAMES,
} from './scanner.constants'

export type ProgressCallback = (progress: ScanProgress) => void

/** Walks scan roots for node_modules folders and builds Project entries. */
export class Scanner {
  private scanning = false

  constructor(private roots: string[] = [homedir()]) {}

  get isScanning(): boolean {
    return this.scanning
  }

  async scan(onProgress?: ProgressCallback): Promise<Project[]> {
    if (this.scanning) throw new Error('Scan already in progress')
    this.scanning = true
    try {
      const found: string[] = []
      let checked = 0
      let lastEmit = 0
      const emit = (currentPath: string, done = false): void => {
        const now = Date.now()
        if (!done && now - lastEmit < PROGRESS_THROTTLE_MS) return
        lastEmit = now
        onProgress?.({ foldersChecked: checked, currentPath, done })
      }

      const walk = async (dir: string, depth: number): Promise<void> => {
        checked++
        emit(dir)
        let entries
        try {
          entries = await readdir(dir, { withFileTypes: true })
        } catch {
          return
        }
        const subdirs: string[] = []
        for (const entry of entries) {
          if (!entry.isDirectory() || entry.isSymbolicLink()) continue
          if (entry.name === 'node_modules') {
            found.push(join(dir, entry.name))
            continue // never descend into node_modules
          }
          // dot-directories are tool internals (editor extensions, caches), not user projects
          if (entry.name.startsWith('.')) continue
          if (SKIPPED_DIR_NAMES.has(entry.name)) continue
          if (depth >= MAX_SCAN_DEPTH) continue
          subdirs.push(join(dir, entry.name))
        }
        for (const sub of subdirs) await walk(sub, depth + 1)
      }

      for (const root of this.roots) await walk(root, 0)

      // Shared across projects so monorepo siblings resolve their repo root once.
      const repoRootCache = new Map<string, string | null>()
      const projects = await mapLimit(found, SIZE_CONCURRENCY, (nm) => {
        emit(dirname(nm))
        return buildProject(nm, repoRootCache)
      })
      emit('', true)
      onProgress?.({ foldersChecked: checked, currentPath: '', done: true })
      return projects
        .filter((p): p is Project => p !== null)
        .sort((a, b) => a.lastUsed - b.lastUsed)
    } finally {
      this.scanning = false
    }
  }
}

async function buildProject(
  nodeModulesPath: string,
  repoRootCache: Map<string, string | null>,
): Promise<Project | null> {
  const projectDir = dirname(nodeModulesPath)
  try {
    const [size, lastUsed, kind, iconDataUrl, name] = await Promise.all([
      folderSize(nodeModulesPath),
      lastUsedTime(projectDir),
      detectKind(projectDir),
      findProjectIcon(projectDir),
      resolveProjectName(projectDir, repoRootCache),
    ])
    return {
      id: createHash('sha1').update(projectDir).digest('hex').slice(0, 12),
      name,
      path: abbreviateHome(projectDir),
      absPath: projectDir,
      kind,
      size,
      lastUsed,
      iconDataUrl,
    }
  } catch {
    return null
  }
}

/** Best-effort "last worked on": newest mtime among project markers. */
async function lastUsedTime(projectDir: string): Promise<number> {
  const candidates = [
    projectDir,
    join(projectDir, 'package.json'),
    join(projectDir, 'src'),
    join(projectDir, '.git'),
  ]
  const times = await Promise.all(
    candidates.map(async (p) => {
      try {
        return (await stat(p)).mtimeMs
      } catch {
        return 0
      }
    }),
  )
  const max = Math.max(...times)
  return max > 0 ? max : Date.now()
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return results
}
