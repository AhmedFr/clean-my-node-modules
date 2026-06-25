import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app, net } from 'electron'
import type { RawAdvisory, RegistryClient } from './registry'

const REGISTRY = 'https://registry.npmjs.org'
const LATEST_TTL_MS = 24 * 60 * 60 * 1000
const REQUEST_TIMEOUT_MS = 8000

interface LatestCacheEntry {
  version: string | null
  at: number
}
interface RegistryCacheShape {
  latest: Record<string, LatestCacheEntry>
}

/** Scoped names must url-encode their slash (`@scope/pkg` -> `@scope%2fpkg`). */
function encodeName(name: string): string {
  return name.startsWith('@') ? name.replace('/', '%2f') : name
}

async function getJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await net.fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS), ...init })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`registry ${res.status} for ${url}`)
  return res.json()
}

/**
 * Real npm-registry client backed by Electron's `net` (respects system proxy)
 * with a disk-cached, TTL'd `latest` lookup. Hard network failures throw so the
 * orchestrator can surface an offline state; 404s resolve to null.
 */
export function createRegistryClient(cacheFile = join(app.getPath('userData'), 'registry-cache.json')): RegistryClient {
  const cache = loadCache(cacheFile)
  let dirty = false

  return {
    async fetchLatest(name) {
      const cached = cache.latest[name]
      if (cached && Date.now() - cached.at < LATEST_TTL_MS) return cached.version
      const body = (await getJson(`${REGISTRY}/${encodeName(name)}/latest`)) as { version?: string } | null
      const version = typeof body?.version === 'string' ? body.version : null
      cache.latest[name] = { version, at: Date.now() }
      dirty = true
      // Persist opportunistically; a write failure must not break enrichment.
      if (dirty) saveCache(cacheFile, cache)
      return version
    },

    async fetchAdvisories(versionsByName) {
      const names = Object.keys(versionsByName)
      if (names.length === 0) return {}
      const body = (await getJson(`${REGISTRY}/-/npm/v1/security/advisories/bulk`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(versionsByName),
      })) as Record<string, RawAdvisory[]> | null
      return body ?? {}
    },
  }
}

function loadCache(file: string): RegistryCacheShape {
  try {
    const raw = JSON.parse(readFileSync(file, 'utf8')) as RegistryCacheShape
    return { latest: raw.latest ?? {} }
  } catch {
    return { latest: {} }
  }
}

function saveCache(file: string, cache: RegistryCacheShape): void {
  try {
    writeFileSync(file, JSON.stringify(cache))
  } catch (err) {
    console.error('Failed to persist registry cache', err)
  }
}
