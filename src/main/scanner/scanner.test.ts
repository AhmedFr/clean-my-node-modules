import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { Scanner } from './scanner'

async function fixtureRoot(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'scan-'))
  await mkdir(join(root, 'proj', 'node_modules'), { recursive: true })
  await writeFile(join(root, 'proj', 'package.json'), '{"name":"proj"}')
  return root
}

describe('Scanner cancel', () => {
  it('scans a fixture root and reports not-cancelled with the project', async () => {
    const out = await new Scanner().scan([await fixtureRoot()])
    expect(out.cancelled).toBe(false)
    expect(out.projects.map((p) => p.name)).toContain('proj')
  })

  it('cancel() aborts the in-flight scan and reports cancelled with no projects', async () => {
    const scanner = new Scanner()
    const p = scanner.scan([await fixtureRoot()])
    scanner.cancel()
    const out = await p
    expect(out.cancelled).toBe(true)
    expect(out.projects).toEqual([])
  })
})
