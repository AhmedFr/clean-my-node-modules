import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { getPath: () => '/tmp' } }))

// imported after the mock so the module's `import { app }` resolves
const { noteVersionChange } = await import('./note-version-change')

const dir = mkdtempSync(join(tmpdir(), 'cmn-updater-'))
const fileIn = (name: string): string => join(dir, name)
afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('noteVersionChange', () => {
  it('returns null on first run and records the version', () => {
    const f = fileIn('first.json')
    expect(noteVersionChange('1.1.0', f)).toBeNull()
    expect(JSON.parse(readFileSync(f, 'utf8'))).toEqual({ version: '1.1.0' })
  })

  it('returns null when the version is unchanged', () => {
    const f = fileIn('same.json')
    noteVersionChange('1.1.0', f)
    expect(noteVersionChange('1.1.0', f)).toBeNull()
  })

  it('returns the previous version after an upgrade', () => {
    const f = fileIn('upgrade.json')
    noteVersionChange('1.1.0', f)
    expect(noteVersionChange('1.2.0', f)).toBe('1.1.0')
    expect(JSON.parse(readFileSync(f, 'utf8'))).toEqual({ version: '1.2.0' })
  })

  it('returns null on a downgrade but still records it', () => {
    const f = fileIn('downgrade.json')
    noteVersionChange('1.2.0', f)
    expect(noteVersionChange('1.1.0', f)).toBeNull()
    expect(JSON.parse(readFileSync(f, 'utf8'))).toEqual({ version: '1.1.0' })
  })
})
