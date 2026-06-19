import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { PnpmPruneResult, PnpmStoreInfo } from '@shared/pnpm-store.types'
import { abbreviateHome } from '../lib/abbreviate-home'
import { folderSize } from '../lib/folder-size'
import { pnpmExecEnv } from './find-node'
import { findPnpm } from './find-pnpm'

const execFileAsync = promisify(execFile)

/** Sizing a multi-GB store with du isn't free; reuse results briefly. */
const INFO_TTL_MS = 5 * 60_000
/** `pnpm store prune` rewrites the store index and can be slow on big stores. */
const PRUNE_TIMEOUT_MS = 10 * 60_000

let cached: PnpmStoreInfo | null = null

export async function getPnpmStoreInfo(force = false): Promise<PnpmStoreInfo> {
  if (!force && cached && Date.now() - cached.checkedAt < INFO_TTL_MS) return cached
  cached = await readStoreInfo()
  return cached
}

/**
 * Removes unreferenced packages from the store via `pnpm store prune` —
 * the only safe way to shrink it (a full delete would break every
 * hardlinked node_modules on disk).
 */
export async function prunePnpmStore(): Promise<PnpmPruneResult> {
  const pnpm = await findPnpm()
  const before = await getPnpmStoreInfo(true)
  if (!pnpm || !before.available) return { ok: false, freedBytes: 0 }
  try {
    const env = await pnpmExecEnv()
    await execFileAsync(pnpm, ['store', 'prune'], { timeout: PRUNE_TIMEOUT_MS, env })
  } catch {
    return { ok: false, freedBytes: 0 }
  }
  const after = await getPnpmStoreInfo(true)
  return { ok: true, freedBytes: Math.max(0, before.sizeBytes - after.sizeBytes) }
}

async function readStoreInfo(): Promise<PnpmStoreInfo> {
  const unavailable: PnpmStoreInfo = {
    available: false,
    path: null,
    displayPath: '',
    sizeBytes: 0,
    checkedAt: Date.now(),
  }
  const pnpm = await findPnpm()
  if (!pnpm) return unavailable
  try {
    const env = await pnpmExecEnv()
    const { stdout } = await execFileAsync(pnpm, ['store', 'path'], { timeout: 10_000, env })
    const path = stdout.trim()
    if (!path) return unavailable
    return {
      available: true,
      path,
      displayPath: abbreviateHome(path),
      sizeBytes: await folderSize(path),
      checkedAt: Date.now(),
    }
  } catch {
    return unavailable
  }
}
