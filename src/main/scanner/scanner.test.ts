import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { ScanProgress } from '@shared/project.types'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Scanner } from './scanner'

let root: string

/** Creates <root>/<rel>/node_modules with one 2KB file so sizes are non-zero. */
async function makeApp(rel: string, name: string): Promise<string> {
  const dir = join(root, rel)
  await mkdir(join(dir, 'node_modules', 'pkg'), { recursive: true })
  await writeFile(join(dir, 'package.json'), JSON.stringify({ name }))
  await writeFile(join(dir, 'node_modules', 'pkg', 'index.js'), 'x'.repeat(2048))
  return dir
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'tidy-scan-'))
})
afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('Scanner', () => {
  it('finds projects, builds entries, and sorts by lastUsed ascending', async () => {
    const aDir = await makeApp('app-a', 'app-a')
    await makeApp('nested/app-b', 'app-b')
    const projects = await new Scanner().scan([root])
    expect(projects.map((p) => p.name).sort()).toEqual(['app-a', 'app-b'])
    const a = projects.find((p) => p.name === 'app-a')
    expect(a?.absPath).toBe(aDir)
    expect(a?.size).toBeGreaterThan(0)
    expect(projects.map((p) => p.lastUsed)).toEqual([...projects.map((p) => p.lastUsed)].sort((x, y) => x - y))
  })

  it('never descends into node_modules or dot-directories', async () => {
    await makeApp('app-a', 'app-a')
    // a nested install inside app-a's node_modules must NOT become a project
    await mkdir(join(root, 'app-a', 'node_modules', 'dep', 'node_modules'), { recursive: true })
    // a project hidden in a dot-directory must NOT be found
    await makeApp('.cache/secret-app', 'secret-app')
    const projects = await new Scanner().scan([root])
    expect(projects.map((p) => p.name)).toEqual(['app-a'])
  })

  it('shares an in-flight scan between concurrent callers', async () => {
    await makeApp('app-a', 'app-a')
    const scanner = new Scanner()
    const p1 = scanner.scan([root])
    const p2 = scanner.scan([root])
    expect(p1).toBe(p2)
    expect(scanner.isScanning).toBe(true)
    await p1
    expect(scanner.isScanning).toBe(false)
  })

  it('emits a final done progress event', async () => {
    await makeApp('app-a', 'app-a')
    const events: ScanProgress[] = []
    await new Scanner().scan([root], (p) => events.push(p))
    expect(events.at(-1)).toMatchObject({ done: true })
    expect(events.at(-1)?.foldersChecked).toBeGreaterThan(0)
  })

  it('survives unreadable roots without throwing', async () => {
    const projects = await new Scanner().scan([join(root, 'does-not-exist')])
    expect(projects).toEqual([])
  })
})
