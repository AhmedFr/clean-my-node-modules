import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ProjectStore } from './project-store'

describe('ProjectStore legacy cache', () => {
  let dir: string
  let file: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'cmnm-ps-'))
    file = join(dir, 'projects-cache.json')
  })
  afterEach(() => rmSync(dir, { recursive: true, force: true }))

  it('leaves uniqueSize undefined for entries written before the real/linked split', () => {
    writeFileSync(
      file,
      JSON.stringify({ projects: [{ id: 'a', name: 'x', path: '~/x', absPath: '/x', kind: 'node', size: 100, lastUsed: 1 }], lastScanTime: 5 }),
    )
    const store = new ProjectStore(file)
    expect(store.all[0].uniqueSize).toBeUndefined()
  })

  it('preserves a real uniqueSize when present', () => {
    writeFileSync(
      file,
      JSON.stringify({ projects: [{ id: 'a', name: 'x', path: '~/x', absPath: '/x', kind: 'node', size: 100, uniqueSize: 40, lastUsed: 1 }], lastScanTime: 5 }),
    )
    const store = new ProjectStore(file)
    expect(store.all[0].uniqueSize).toBe(40)
  })
})
