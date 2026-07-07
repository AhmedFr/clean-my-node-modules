import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { sep } from 'node:path'

interface Options {
  home?: string
  exists?: (p: string) => boolean
}

/** Effective scan roots for a run: home plus user extras, keeping only paths
 *  that currently exist, deduped, with any root nested inside another removed. */
export function resolveScanRoots(scanRoots: string[], opts: Options = {}): string[] {
  const home = opts.home ?? homedir()
  const exists = opts.exists ?? existsSync
  const present = [home, ...scanRoots].filter((p, i, a) => a.indexOf(p) === i).filter(exists)
  return present.filter(
    (p) => !present.some((other) => other !== p && p.startsWith(other.endsWith(sep) ? other : other + sep)),
  )
}
