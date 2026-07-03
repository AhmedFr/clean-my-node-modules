import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { getPath: () => '/tmp' } }))

const { getInstallId } = await import('./install-id')

const dir = mkdtempSync(join(tmpdir(), 'cmn-install-id-'))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('getInstallId', () => {
  it('generates a UUID, persists it, and returns the same id on later calls', () => {
    const f = join(dir, 'id.json')
    const id = getInstallId(f)
    expect(id).toMatch(/^[0-9a-f-]{36}$/)
    expect(getInstallId(f)).toBe(id)
    expect(JSON.parse(readFileSync(f, 'utf8'))).toEqual({ id })
  })

  it('regenerates on a corrupt file', () => {
    const f = join(dir, 'corrupt.json')
    writeFileSync(f, 'nope')
    expect(getInstallId(f)).toMatch(/^[0-9a-f-]{36}$/)
  })
})
