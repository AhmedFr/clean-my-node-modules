import { execFile } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import type {
  DockerActionResult,
  DockerInfo,
  DockerItemKind,
  DockerProject,
  DockerPruneTarget,
} from '@shared/docker.types'
import { app } from 'electron'
import { detectKind } from '../scanner/detect-kind'
import { findProjectIcon } from '../scanner/find-project-icon'
import { associateProjects } from './docker-associate'
import { parseContainerInspect, parseVolumeInspect } from './docker-inspect'
import { buildDockerItems, parseDf, parseSize } from './docker-parse'
import { dockerExecEnv, findDocker } from './find-docker'

const CLI_TIMEOUT_MS = 60_000
const PRUNE_TIMEOUT_MS = 10 * 60_000
const MAX_BUFFER = 32 * 1024 * 1024

type Exec = (
  bin: string,
  args: string[],
  opts: { timeout: number; env: NodeJS.ProcessEnv; maxBuffer: number },
) => Promise<{ stdout: string; stderr: string }>

let execImpl: Exec = promisify(execFile) as unknown as Exec
/** Test seam: swap the exec used by all docker calls. */
export function __setExecForTests(fn: Exec): void {
  execImpl = fn
}

export interface DockerOpts {
  binaryPath?: string
}

let cached: DockerInfo | null = null
let cachedKey = ''
let diskLoaded = false
let inFlight: Promise<DockerInfo> | null = null
let inFlightKey = ''

const cacheFile = (): string => join(app.getPath('userData'), 'docker-cache.json')

function loadDiskCache(): void {
  if (diskLoaded) return
  diskLoaded = true
  try {
    const raw = JSON.parse(readFileSync(cacheFile(), 'utf8')) as { key: string; info: DockerInfo }
    if (raw?.info) {
      cached = raw.info
      cachedKey = raw.key ?? ''
    }
  } catch {
    // no cache yet
  }
}

function saveDiskCache(): void {
  if (!cached) return
  try {
    const file = cacheFile()
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify({ key: cachedKey, info: cached }))
  } catch (err) {
    console.error('Failed to persist docker cache', err)
  }
}

async function run(bin: string, args: string[], timeout = CLI_TIMEOUT_MS): Promise<string> {
  const env = (await dockerExecEnv()) as NodeJS.ProcessEnv
  const { stdout } = await execImpl(bin, args, { timeout, env, maxBuffer: MAX_BUFFER })
  return stdout
}

async function readDockerInfo(opts: DockerOpts): Promise<DockerInfo> {
  const now = Date.now()
  const bin = await findDocker(opts.binaryPath)
  if (!bin) return { available: false, reason: 'not installed', checkedAt: now, totals: [], items: [], projects: [] }
  try {
    await run(bin, ['version', '--format', '{{.Server.Version}}'])
  } catch {
    return { available: false, reason: 'daemon not running', checkedAt: now, totals: [], items: [], projects: [] }
  }
  let df = ''
  try {
    df = await run(bin, ['system', 'df', '-v', '--format', '{{json .}}'])
  } catch {
    return { available: false, reason: 'daemon not running', checkedAt: now, totals: [], items: [], projects: [] }
  }
  const { items, totals } = buildDockerItems(parseDf(df))

  // Enrich with project association (fail-soft: any inspect failure → everything in "Other").
  let enriched = items
  let projects: DockerProject[] = []
  try {
    const ids = (await run(bin, ['ps', '-aq', '--no-trunc']))
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const containers = ids.length ? parseContainerInspect(await run(bin, ['container', 'inspect', ...ids])) : []
    const volNames = items.filter((i) => i.kind === 'volume').map((i) => i.id)
    const volProjects = volNames.length
      ? parseVolumeInspect(await run(bin, ['volume', 'inspect', ...volNames]))
      : new Map<string, string>()
    const assoc = associateProjects(items, containers, volProjects)
    const projectsWithLogos = await withLogos(assoc.projects)
    enriched = assoc.items
    projects = projectsWithLogos
  } catch {
    // leave items unassociated
  }
  return { available: true, checkedAt: now, totals, items: enriched, projects }
}

/** Attach a project logo (framework kind + favicon) from each project's working_dir.
 * Fail-soft per project: a missing/unreadable dir leaves kind/iconDataUrl undefined,
 * and the renderer shows a generic Docker icon. */
async function withLogos(projects: DockerProject[]): Promise<DockerProject[]> {
  return Promise.all(
    projects.map(async (p) => {
      if (!p.workingDir) return p
      try {
        const [kind, iconDataUrl] = await Promise.all([detectKind(p.workingDir), findProjectIcon(p.workingDir)])
        return { ...p, kind, iconDataUrl }
      } catch {
        return p
      }
    }),
  )
}

export async function getDockerInfo(force = false, opts: DockerOpts = {}): Promise<DockerInfo> {
  loadDiskCache()
  const key = opts.binaryPath ?? ''
  if (!force && cached && key === cachedKey) return cached
  if (inFlight && inFlightKey === key) return inFlight
  const pending = (async (): Promise<DockerInfo> => {
    const info = await readDockerInfo(opts)
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

/** Grand-total docker disk usage in bytes (sum of `docker system df` rows), or null if it could not be measured. */
async function totalDiskBytes(bin: string): Promise<number | null> {
  try {
    const out = await run(bin, ['system', 'df', '--format', '{{json .}}'])
    // df grand total prints one JSON object per row (Type, Size, Reclaimable, ...)
    return out
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .reduce((sum, line) => {
        try {
          return sum + parseSize((JSON.parse(line) as { Size: string }).Size)
        } catch {
          return sum
        }
      }, 0)
  } catch {
    return null
  }
}

const REMOVE_ARGS: Record<Exclude<DockerItemKind, 'buildcache'>, (id: string) => string[]> = {
  image: (id) => ['rmi', id],
  volume: (id) => ['volume', 'rm', id],
  container: (id) => ['rm', id],
}

export async function removeDockerItem(
  kind: DockerItemKind,
  id: string,
  opts: DockerOpts = {},
): Promise<DockerActionResult> {
  const bin = await findDocker(opts.binaryPath)
  if (!bin || kind === 'buildcache') return { ok: false, freedBytes: 0 }
  const before = await totalDiskBytes(bin)
  try {
    // in-use guard lives in the UI/validation; the CLI itself also refuses an
    // in-use image/volume without -f (which we never pass), so this is safe.
    await run(bin, REMOVE_ARGS[kind](id))
  } catch {
    return { ok: false, freedBytes: 0 }
  }
  const after = await totalDiskBytes(bin)
  const freedBytes = before !== null && after !== null ? Math.max(0, before - after) : 0
  return { ok: true, freedBytes }
}

const PRUNE_ARGS: Record<DockerPruneTarget, string[]> = {
  danglingImages: ['image', 'prune', '-f'],
  unusedImages: ['image', 'prune', '-a', '-f'],
  stoppedContainers: ['container', 'prune', '-f'],
  buildCache: ['builder', 'prune', '-f'],
  unusedVolumes: ['volume', 'prune', '-f'],
}

export async function pruneDocker(target: DockerPruneTarget, opts: DockerOpts = {}): Promise<DockerActionResult> {
  const bin = await findDocker(opts.binaryPath)
  if (!bin) return { ok: false, freedBytes: 0 }
  const before = await totalDiskBytes(bin)
  try {
    await run(bin, PRUNE_ARGS[target], PRUNE_TIMEOUT_MS)
  } catch {
    return { ok: false, freedBytes: 0 }
  }
  const after = await totalDiskBytes(bin)
  const freedBytes = before !== null && after !== null ? Math.max(0, before - after) : 0
  return { ok: true, freedBytes }
}

export { CLI_TIMEOUT_MS, PRUNE_TIMEOUT_MS, run }
