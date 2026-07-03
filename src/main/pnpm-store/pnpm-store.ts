import { execFile } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import type { PnpmPruneResult, PnpmStoreInfo } from '@shared/pnpm-store.types'
import { app } from 'electron'
import { abbreviateHome } from '../lib/abbreviate-home'
import { folderSize } from '../lib/folder-size'
import { pnpmExecEnv } from './find-node'
import { findPnpm } from './find-pnpm'
import { inferStoreDir } from './infer-store'

const execFileAsync = promisify(execFile)

/** `pnpm store prune` rewrites the store index and can be slow on big stores. */
const PRUNE_TIMEOUT_MS = 10 * 60_000

export interface StoreOverrides {
  storePath?: string
  binaryPath?: string
}

// Sizing a multi-GB store with `du` costs seconds, so the result is cached in
// memory AND persisted to disk: a launch shows the last-known size instantly and
// only recomputes when forced (a scan finished, a prune, or a manual refresh).
interface StoreCache {
  key: string
  info: PnpmStoreInfo
}

let cached: PnpmStoreInfo | null = null
let cachedKey = ''
let diskLoaded = false
let inFlight: Promise<PnpmStoreInfo> | null = null
let inFlightKey = ''

const keyOf = (o: StoreOverrides): string => `${o.storePath ?? ''}|${o.binaryPath ?? ''}`
const cacheFile = (): string => join(app.getPath('userData'), 'pnpm-store-cache.json')

function loadDiskCache(): void {
  if (diskLoaded) return
  diskLoaded = true
  try {
    const raw = JSON.parse(readFileSync(cacheFile(), 'utf8')) as StoreCache
    if (raw?.info) {
      cached = raw.info
      cachedKey = raw.key ?? ''
    }
  } catch {
    // no cache on disk yet
  }
}

function saveDiskCache(): void {
  if (!cached) return
  try {
    const file = cacheFile()
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify({ key: cachedKey, info: cached } satisfies StoreCache))
  } catch (err) {
    console.error('Failed to persist pnpm store cache', err)
  }
}

export async function getPnpmStoreInfo(force = false, overrides: StoreOverrides = {}): Promise<PnpmStoreInfo> {
  loadDiskCache()
  const key = keyOf(overrides)
  // Unforced: return the cached size instantly (from memory or disk) when keys match.
  if (!force && cached && key === cachedKey) return cached
  // Coalesce concurrent recomputes for the same target (e.g. a scan + a manual refresh).
  if (inFlight && inFlightKey === key) return inFlight

  const pending = (async (): Promise<PnpmStoreInfo> => {
    const info = await readStoreInfo(overrides)
    cached = info
    cachedKey = key
    saveDiskCache()
    return info
  })()
  inFlight = pending
  inFlightKey = key
  void pending.finally(() => {
    if (inFlight === pending) inFlight = null
  })
  return pending
}

async function isDir(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

async function ok(path: string, source: PnpmStoreInfo['source'], canPrune: boolean): Promise<PnpmStoreInfo> {
  return {
    available: true,
    path,
    displayPath: abbreviateHome(path),
    sizeBytes: await folderSize(path),
    checkedAt: Date.now(),
    source,
    canPrune,
  }
}

/** Layered resolution: manual store path → run pnpm → infer from disk → none. */
async function readStoreInfo(overrides: StoreOverrides): Promise<PnpmStoreInfo> {
  const binary = await findPnpm(overrides.binaryPath)
  const canPrune = binary !== null

  // 1. Manual store path wins when it points at a real directory.
  if (overrides.storePath) {
    if (await isDir(overrides.storePath)) return ok(overrides.storePath, 'manual', canPrune)
  }

  // 2. Ask pnpm itself (with node resolved onto PATH for the shebang).
  if (binary) {
    try {
      const env = await pnpmExecEnv()
      const { stdout } = await execFileAsync(binary, ['store', 'path'], { timeout: 10_000, env })
      const path = stdout.trim()
      if (path && (await isDir(path))) return ok(path, 'pnpm', canPrune)
    } catch {
      // fall through to inference
    }
  }

  // 3. Infer the store location straight from disk — no pnpm execution needed.
  const inferred = await inferStoreDir(process.env, homedir())
  if (inferred) return ok(inferred, 'inferred', canPrune)

  // 4. Nothing worked — explain why so the UI can guide a manual override.
  return {
    available: false,
    path: null,
    displayPath: '',
    sizeBytes: 0,
    checkedAt: Date.now(),
    source: 'none',
    canPrune,
    reason: binary
      ? 'pnpm is installed but its store could not be located. Set the store folder in Settings'
      : 'pnpm not found. Choose its binary or the store folder in Settings',
  }
}

/**
 * Removes unreferenced packages from the store via `pnpm store prune` — the
 * only safe way to shrink it (a full delete would break every hardlinked
 * node_modules on disk). Requires a runnable pnpm binary.
 */
export async function prunePnpmStore(overrides: StoreOverrides = {}): Promise<PnpmPruneResult> {
  const pnpm = await findPnpm(overrides.binaryPath)
  const before = await getPnpmStoreInfo(true, overrides)
  if (!pnpm || !before.available) return { ok: false, freedBytes: 0 }
  try {
    const env = await pnpmExecEnv()
    await execFileAsync(pnpm, ['store', 'prune'], { timeout: PRUNE_TIMEOUT_MS, env })
  } catch {
    return { ok: false, freedBytes: 0 }
  }
  const after = await getPnpmStoreInfo(true, overrides)
  return { ok: true, freedBytes: Math.max(0, before.sizeBytes - after.sizeBytes) }
}
