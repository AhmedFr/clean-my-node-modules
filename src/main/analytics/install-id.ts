import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { app } from 'electron'

/** Stable anonymous id for this install; survives restarts, never leaves userData. */
export function getInstallId(filePath = join(app.getPath('userData'), 'install-id.json')): string {
  try {
    const raw = JSON.parse(readFileSync(filePath, 'utf8')) as { id?: unknown }
    if (typeof raw.id === 'string' && raw.id.length > 0) return raw.id
  } catch {
    // fall through to generation
  }
  const id = randomUUID()
  try {
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileSync(filePath, JSON.stringify({ id }))
  } catch (err) {
    console.error('Failed to persist install id', err)
  }
  return id
}
