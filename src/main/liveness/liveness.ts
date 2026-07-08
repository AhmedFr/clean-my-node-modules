import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { LiveInfo } from './liveness.types'
import { matchLive } from './match-live'
import { parseLsofCwd } from './parse-lsof-cwd'
import { parseLsofPorts } from './parse-lsof-ports'

const execFileAsync = promisify(execFile)

// -b: non-blocking (never hang on a stuck mount); -w: suppress warnings; -n/-P: no name lookups.
const run = async (args: string[]): Promise<string> => {
  try {
    const { stdout } = await execFileAsync('lsof', args, { maxBuffer: 8 * 1024 * 1024 })
    return stdout
  } catch (err) {
    // lsof exits non-zero when some fds are inaccessible but still prints usable output.
    const stdout = (err as { stdout?: string }).stdout
    return typeof stdout === 'string' ? stdout : ''
  }
}

/** Live projects among `projectDirs`, keyed by dir. Empty on any failure. */
export async function detectLiveProjects(projectDirs: string[]): Promise<Map<string, LiveInfo>> {
  if (projectDirs.length === 0) return new Map()
  const uid = String(process.getuid?.() ?? '')
  const [cwdOut, portOut] = await Promise.all([
    run(['-b', '-w', '-n', '-a', '-d', 'cwd', ...(uid ? ['-u', uid] : []), '-F', 'pcn']),
    run(['-b', '-w', '-n', '-P', '-iTCP', '-sTCP:LISTEN', '-F', 'pn']),
  ])
  return matchLive(parseLsofCwd(cwdOut), projectDirs, parseLsofPorts(portOut))
}
