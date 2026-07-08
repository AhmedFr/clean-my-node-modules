import { lstatSync } from 'node:fs'
import { readdir as readdirP } from 'node:fs/promises'
import { join } from 'node:path'

interface Deps {
  volumesDir?: string
  readdir?: (dir: string) => Promise<string[]>
  statDev?: (p: string) => number | null
}

// lstat (not stat) so a symlink under /Volumes reports its own device id, not the
// target's — a symlink that points back at the boot disk is then correctly
// excluded by the `dev === rootDev` check below, instead of resolving through to
// whatever device it links to.
const defaultStatDev = (p: string): number | null => {
  try {
    return lstatSync(p).dev
  } catch {
    return null
  }
}

/** Mounted external volumes under /Volumes, excluding the boot disk. */
export async function listExternalVolumes(deps: Deps = {}): Promise<{ path: string; name: string }[]> {
  const volumesDir = deps.volumesDir ?? '/Volumes'
  const readdir = deps.readdir ?? ((dir: string) => readdirP(dir))
  const statDev = deps.statDev ?? defaultStatDev
  const rootDev = statDev('/')
  const names = await readdir(volumesDir).catch(() => [] as string[])
  const out: { path: string; name: string }[] = []
  for (const name of names) {
    const path = join(volumesDir, name)
    const dev = statDev(path)
    if (dev === null || dev === rootDev) continue
    out.push({ path, name })
  }
  return out
}
