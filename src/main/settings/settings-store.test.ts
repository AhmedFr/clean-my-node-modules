import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { DEFAULT_SETTINGS } from '@shared/settings.constants'

vi.mock('electron', () => ({ app: { getPath: () => '/tmp' } }))

// imported after the mock so the module's `import { app }` resolves
const { SettingsStore } = await import('./settings-store')

const dir = mkdtempSync(join(tmpdir(), 'cmn-settings-'))
const fileIn = (name: string): string => join(dir, name)
afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('SettingsStore', () => {
  it('returns defaults when the file is missing', () => {
    expect(new SettingsStore(fileIn('missing.json')).get()).toEqual(DEFAULT_SETTINGS)
  })

  it('falls back to defaults on corrupt JSON', () => {
    const f = fileIn('corrupt.json')
    writeFileSync(f, '{ not: valid')
    expect(new SettingsStore(f).get()).toEqual(DEFAULT_SETTINGS)
  })

  it('merges persisted values over defaults', () => {
    const f = fileIn('partial.json')
    writeFileSync(f, JSON.stringify({ thresholdGB: 12, notify: false }))
    const s = new SettingsStore(f)
    expect(s.get().thresholdGB).toBe(12)
    expect(s.get().notify).toBe(false)
    expect(s.get().density).toBe(DEFAULT_SETTINGS.density)
  })

  it('persists and notifies on set, and a fresh store reads it back', () => {
    const f = fileIn('roundtrip.json')
    const s = new SettingsStore(f)
    const seen: number[] = []
    const off = s.onChange((next) => seen.push(next.thresholdGB))
    s.set('thresholdGB', 7)
    off()
    expect(s.get().thresholdGB).toBe(7)
    expect(seen).toEqual([7])
    expect(new SettingsStore(f).get().thresholdGB).toBe(7)
  })
})
