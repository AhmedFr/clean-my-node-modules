import { createHash } from 'node:crypto'
import { readdir, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import type { Project, ScanProgress } from '@shared/project.types'
import { abbreviateHome } from '../lib/abbreviate-home'
import { measureNodeModules } from '../lib/folder-size'
import { mapLimit } from '../lib/map-limit'
import { detectKind } from './detect-kind'
import { findProjectIcon } from './find-project-icon'
import { resolveProjectName } from './resolve-name'
import { MAX_SCAN_DEPTH, PROGRESS_THROTTLE_MS, SIZE_CONCURRENCY, SKIPPED_DIR_NAMES } from './scanner.constants'

export type ProgressCallback = (progress: ScanProgress) => void

export interface ScanOutcome {
  cancelled: boolean
  projects: Project[]
}

/** Walks scan roots for node_modules folders and builds Project entries. */
export class Scanner {
  private current: Promise<ScanOutcome> | null = null
  private controller: AbortController | null = null

  get isScanning(): boolean {
    return this.current !== null
  }

  /** Aborts the in-flight scan (no-op when idle). */
  cancel(): void {
    this.controller?.abort()
  }

  /** Concurrent callers share the in-flight scan instead of starting a second. */
  scan(roots: string[], onProgress?: ProgressCallback): Promise<ScanOutcome> {
    if (this.current) return this.current
    this.controller = new AbortController()
    this.current = this.run(roots, this.controller.signal, onProgress)
    return this.current
  }

  private async run(roots: string[], signal: AbortSignal, onProgress?: ProgressCallback): Promise<ScanOutcome> {
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
        if (signal.aborted) return
        checked++
        emit(dir)
        const entries = await readdir(dir, { withFileTypes: true }).catch(() => null)
        if (!entries) return
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

      for (const root of roots) await walk(root, 0)
      if (signal.aborted) {
        emit('', true)
        return { cancelled: true, projects: [] }
      }

      // Shared across projects so monorepo siblings resolve their repo root once.
      const repoRootCache = new Map<string, string | null>()
      const projects = await mapLimit(found, SIZE_CONCURRENCY, (nm) => {
        if (signal.aborted) return Promise.resolve(null)
        emit(dirname(nm))
        return buildProject(nm, repoRootCache, signal)
      })
      if (signal.aborted) {
        emit('', true)
        return { cancelled: true, projects: [] }
      }
      emit('', true)
      return {
        cancelled: false,
        projects: projects.filter((p): p is Project => p !== null).sort((a, b) => a.lastUsed - b.lastUsed),
      }
    } finally {
      this.current = null
      this.controller = null
    }
  }
}

async function buildProject(
  nodeModulesPath: string,
  repoRootCache: Map<string, string | null>,
  signal?: AbortSignal,
): Promise<Project | null> {
  const projectDir = dirname(nodeModulesPath)
  try {
    const [sizes, lastUsed, kind, iconDataUrl, name] = await Promise.all([
      measureNodeModules(nodeModulesPath, signal),
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
      size: sizes.apparent,
      uniqueSize: sizes.unique,
      lastUsed,
      iconDataUrl,
    }
  } catch {
    return null
  }
}

/** Best-effort "last worked on": newest mtime among project markers. */
async function lastUsedTime(projectDir: string): Promise<number> {
  const candidates = [projectDir, join(projectDir, 'package.json'), join(projectDir, 'src'), join(projectDir, '.git')]
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
