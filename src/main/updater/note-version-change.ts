import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app } from 'electron'
import { lt, valid } from 'semver'

/**
 * Records the running version in userData; returns the previous version only when
 * this launch is the first on a strictly newer one (i.e. an update just landed).
 */
export function noteVersionChange(
  current: string,
  filePath = join(app.getPath('userData'), 'last-run-version.json'),
): string | null {
  let previous: string | null = null
  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf8')) as { version?: unknown }
    if (typeof raw.version === 'string') previous = raw.version
  } catch {
    // first run: no file yet
  }
  if (previous !== current) {
    try {
      mkdirSync(dirname(filePath), { recursive: true })
      writeFileSync(filePath, JSON.stringify({ version: current }))
    } catch (err) {
      console.error('Failed to persist last-run version', err)
    }
  }
  return previous && valid(previous) && valid(current) && lt(previous, current) ? previous : null
}
