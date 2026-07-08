import { sep } from 'node:path'
import type { LiveInfo } from './liveness.types'

interface Proc {
  pid: number
  command: string
  cwd: string
}

const isUnder = (cwd: string, dir: string): boolean =>
  cwd === dir || cwd.startsWith(dir.endsWith(sep) ? dir : dir + sep)

/** Map each live project dir to its first matching process (with optional port). */
export function matchLive(procs: Proc[], projectDirs: string[], ports?: Map<number, number>): Map<string, LiveInfo> {
  const live = new Map<string, LiveInfo>()
  for (const dir of projectDirs) {
    const hit = procs.find((p) => isUnder(p.cwd, dir))
    if (!hit) continue
    const info: LiveInfo = { pid: hit.pid, command: hit.command }
    const port = ports?.get(hit.pid)
    if (port !== undefined) info.port = port
    live.set(dir, info)
  }
  return live
}
