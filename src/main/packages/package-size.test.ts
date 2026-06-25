import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { PackageEntry, PackageUsage } from '@shared/package.types'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { measureInstalledPackage, sizeEntries } from './package-size'

const u = (projectId: string, version: string, unresolved = false): PackageUsage => ({
  projectId,
  projectName: projectId,
  version,
  ...(unresolved ? { unresolved: true } : {}),
  dev: false,
})

const entry = (name: string, usages: PackageUsage[]): PackageEntry => ({
  name,
  usages,
  projectCount: new Set(usages.map((x) => x.projectId)).size,
  versions: [...new Set(usages.map((x) => x.version))],
  multipleVersions: new Set(usages.map((x) => x.version)).size > 1,
})

describe('sizeEntries', () => {
  it('sets each entry size to the largest measured version, measuring once per version', async () => {
    const entries = [entry('react', [u('p1', '18.3.1'), u('p3', '18.3.1'), u('p2', '17.0.2')])]
    const dirById = new Map([
      ['p1', '/d1'],
      ['p2', '/d2'],
      ['p3', '/d3'],
    ])
    const calls: string[] = []
    const measure = async (dir: string, name: string): Promise<number | null> => {
      calls.push(`${dir}:${name}`)
      return dir === '/d1' ? 500 : 900 // 18.3.1 -> 500 (via p1), 17.0.2 -> 900 (via p2)
    }
    await sizeEntries(entries, dirById, measure)
    expect(entries[0].size).toBe(900)
    // 18.3.1 measured once (p1), 17.0.2 once (p2); the duplicate p3@18.3.1 is not re-measured
    expect(calls).toEqual(['/d1:react', '/d2:react'])
  })

  it('skips unresolved usages and leaves size undefined when none resolve', async () => {
    const entries = [entry('ghost', [u('p1', '^1.0.0', true)])]
    const calls: string[] = []
    const measure = async (dir: string, name: string): Promise<number | null> => {
      calls.push(`${dir}:${name}`)
      return 123
    }
    await sizeEntries(entries, new Map([['p1', '/d1']]), measure)
    expect(entries[0].size).toBeUndefined()
    expect(calls).toEqual([])
  })

  it('leaves size undefined when measurement returns null', async () => {
    const entries = [entry('gone', [u('p1', '1.0.0')])]
    await sizeEntries(entries, new Map([['p1', '/d1']]), async () => null)
    expect(entries[0].size).toBeUndefined()
  })
})

describe('measureInstalledPackage', () => {
  let dir: string
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'cmnm-size-'))
    // a real package dir with content
    await mkdir(join(dir, 'node_modules', 'realpkg'), { recursive: true })
    await writeFile(join(dir, 'node_modules', 'realpkg', 'index.js'), 'x'.repeat(4096))
    // a pnpm-style symlinked package pointing at a store-like target
    await mkdir(join(dir, 'store', 'linkpkg'), { recursive: true })
    await writeFile(join(dir, 'store', 'linkpkg', 'index.js'), 'y'.repeat(4096))
    await symlink(join(dir, 'store', 'linkpkg'), join(dir, 'node_modules', 'linkpkg'))
  })
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('measures a real package directory', async () => {
    const size = await measureInstalledPackage(dir, 'realpkg')
    expect(size).toBeGreaterThan(0)
  })

  it('follows a symlink to the real package directory', async () => {
    const size = await measureInstalledPackage(dir, 'linkpkg')
    expect(size).toBeGreaterThan(0)
  })

  it('returns null when the package is not installed', async () => {
    expect(await measureInstalledPackage(dir, 'nope')).toBeNull()
  })
})
