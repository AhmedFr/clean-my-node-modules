import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { directDepsFromManifest, readProjectPackages, resolveInstalledVersion } from './read-manifest'

describe('directDepsFromManifest', () => {
  it('combines dependencies and devDependencies, flagging dev', () => {
    const deps = directDepsFromManifest({
      dependencies: { react: '^18.0.0' },
      devDependencies: { vitest: '^2.0.0' },
    })
    expect(deps).toContainEqual({ name: 'react', range: '^18.0.0', dev: false })
    expect(deps).toContainEqual({ name: 'vitest', range: '^2.0.0', dev: true })
  })

  it('treats a package present in both as a production dependency', () => {
    const deps = directDepsFromManifest({
      dependencies: { typescript: '^5.0.0' },
      devDependencies: { typescript: '^4.0.0' },
    })
    expect(deps.filter((d) => d.name === 'typescript')).toEqual([{ name: 'typescript', range: '^5.0.0', dev: false }])
  })

  it('returns an empty array when there are no deps', () => {
    expect(directDepsFromManifest({})).toEqual([])
  })
})

describe('filesystem reads', () => {
  let dir: string
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'cmnm-pkg-'))
    await writeFile(
      join(dir, 'package.json'),
      JSON.stringify({
        dependencies: { react: '^18.0.0', missingpkg: '^1.0.0' },
        devDependencies: { vitest: '^2.0.0' },
      }),
    )
    // react resolves to 18.3.1; vitest resolves to 2.1.8; missingpkg is not installed
    await mkdir(join(dir, 'node_modules', 'react'), { recursive: true })
    await writeFile(
      join(dir, 'node_modules', 'react', 'package.json'),
      JSON.stringify({ name: 'react', version: '18.3.1' }),
    )
    await mkdir(join(dir, 'node_modules', 'vitest'), { recursive: true })
    await writeFile(
      join(dir, 'node_modules', 'vitest', 'package.json'),
      JSON.stringify({ name: 'vitest', version: '2.1.8' }),
    )
  })
  afterAll(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('resolveInstalledVersion reads the installed version', async () => {
    expect(await resolveInstalledVersion(dir, 'react')).toBe('18.3.1')
  })

  it('resolveInstalledVersion returns null for a package not in node_modules', async () => {
    expect(await resolveInstalledVersion(dir, 'missingpkg')).toBeNull()
  })

  it('readProjectPackages pairs each direct dep with its resolved version', async () => {
    const project = { id: 'abc123', name: 'demo', absPath: dir }
    const out = await readProjectPackages(project)
    const react = out.find((p) => p.name === 'react')
    expect(react?.usage).toMatchObject({ projectId: 'abc123', projectName: 'demo', version: '18.3.1', dev: false })
    expect(react?.usage.unresolved).toBeUndefined()
  })

  it('readProjectPackages falls back to the declared range and flags unresolved', async () => {
    const project = { id: 'abc123', name: 'demo', absPath: dir }
    const out = await readProjectPackages(project)
    const missing = out.find((p) => p.name === 'missingpkg')
    expect(missing?.usage.version).toBe('^1.0.0')
    expect(missing?.usage.unresolved).toBe(true)
  })

  it('readProjectPackages returns [] for a project with no package.json', async () => {
    const empty = await mkdtemp(join(tmpdir(), 'cmnm-empty-'))
    try {
      expect(await readProjectPackages({ id: 'x', name: 'x', absPath: empty })).toEqual([])
    } finally {
      await rm(empty, { recursive: true, force: true })
    }
  })
})
