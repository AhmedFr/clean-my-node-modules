import { execFile } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { promisify } from 'node:util'
import type { DockerInfo } from '@shared/docker.types'
import { app } from 'electron'
import { buildDockerItems, parseContainers, parseDf } from './docker-parse'
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
  if (!bin) return { available: false, reason: 'not installed', checkedAt: now, totals: [], items: [] }
  try {
    await run(bin, ['version', '--format', '{{.Server.Version}}'])
  } catch {
    return { available: false, reason: 'daemon not running', checkedAt: now, totals: [], items: [] }
  }
  let df = ''
  let ps = ''
  try {
    df = await run(bin, ['system', 'df', '-v', '--format', '{{json .}}'])
    ps = await run(bin, ['ps', '-a', '--no-trunc', '--format', '{{json .}}'])
  } catch {
    return { available: false, reason: 'daemon not running', checkedAt: now, totals: [], items: [] }
  }
  const { items, totals } = buildDockerItems(parseDf(df), parseContainers(ps))
  return { available: true, checkedAt: now, totals, items }
}

export async function getDockerInfo(force = false, opts: DockerOpts = {}): Promise<DockerInfo> {
  loadDiskCache()
  const key = opts.binaryPath ?? ''
  if (!force && cached && key === cachedKey) return cached
  if (inFlight) return inFlight
  const pending = (async (): Promise<DockerInfo> => {
    const info = await readDockerInfo(opts)
    cached = info
    cachedKey = key
    saveDiskCache()
    return info
  })()
  inFlight = pending
  void pending.finally(() => {
    if (inFlight === pending) inFlight = null
  })
  return pending
}

export { CLI_TIMEOUT_MS, PRUNE_TIMEOUT_MS, run }
