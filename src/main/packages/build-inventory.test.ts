import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Project } from '@shared/project.types'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildInventory } from './build-inventory'
import type { RegistryClient } from './registry'

const fakeClient: RegistryClient = {
  fetchLatest: async (name) => (name === 'react' ? '18.3.1' : null),
  fetchAdvisories: async () => ({}),
}

describe('buildInventory', () => {
  let dir: string
  let project: Project
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'cmnm-inv-'))
    await writeFile(join(dir, 'package.json'), JSON.stringify({ dependencies: { react: '^18.0.0' } }))
    await mkdir(join(dir, 'node_modules', 'react'), { recursive: true })
    await writeFile(
      join(dir, 'node_modules', 'react', 'package.json'),
      JSON.stringify({ name: 'react', version: '18.0.0' }),
    )
    await writeFile(join(dir, 'node_modules', 'react', 'index.js'), 'x'.repeat(2048))
    project = {
      id: 'p1',
      name: 'demo',
      path: dir,
      absPath: dir,
      kind: 'react',
      size: 0,
      lastUsed: 0,
    }
  })
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('enumerates, aggregates, sizes and enriches when checkUpdates is on', async () => {
    const inv = await buildInventory([project], { checkUpdates: true }, () => fakeClient)
    expect(inv.projectCount).toBe(1)
    const react = inv.packages.find((p) => p.name === 'react')
    expect(react).toMatchObject({ projectCount: 1, versions: ['18.0.0'], latest: '18.3.1', outdated: true })
    expect(react?.size).toBeGreaterThan(0)
    expect(inv.enrichmentError).toBeUndefined()
  })

  it('skips registry enrichment when checkUpdates is off', async () => {
    let called = false
    const spyClient: RegistryClient = {
      fetchLatest: async () => {
        called = true
        return '9.9.9'
      },
      fetchAdvisories: async () => ({}),
    }
    const inv = await buildInventory([project], { checkUpdates: false }, () => spyClient)
    expect(called).toBe(false)
    expect(inv.packages.find((p) => p.name === 'react')?.latest).toBeUndefined()
  })
})
