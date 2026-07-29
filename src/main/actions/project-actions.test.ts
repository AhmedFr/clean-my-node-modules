import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Project } from '@shared/project.types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  trashItem: vi.fn(async (_p: string) => {}),
  showItemInFolder: vi.fn((_p: string) => {}),
  openPath: vi.fn(async (_p: string) => ''),
  execFileFails: { value: false },
}))

vi.mock('electron', () => ({
  shell: {
    trashItem: mocks.trashItem,
    showItemInFolder: mocks.showItemInFolder,
    openPath: mocks.openPath,
  },
}))

vi.mock('node:child_process', () => ({
  execFile: (_cmd: string, _args: string[], cb: (err: Error | null, stdout: string, stderr: string) => void) => {
    cb(mocks.execFileFails.value ? new Error('open failed') : null, '', '')
  },
}))

import { deleteNodeModules, guardExists, openProject, revealInFinder } from './project-actions'

function project(over: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'demo',
    path: '~/code/demo',
    absPath: '/Users/me/code/demo',
    kind: 'node',
    size: 4096,
    lastUsed: 0,
    ...over,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.execFileFails.value = false
})

describe('deleteNodeModules', () => {
  it('trashes exactly <absPath>/node_modules — never anything else — and reports freed bytes', async () => {
    const p = project()
    const freed = await deleteNodeModules(p)
    expect(mocks.trashItem).toHaveBeenCalledTimes(1)
    expect(mocks.trashItem).toHaveBeenCalledWith('/Users/me/code/demo/node_modules')
    expect(freed).toBe(4096)
  })

  it('propagates trash failures instead of reporting success', async () => {
    mocks.trashItem.mockRejectedValueOnce(new Error('EPERM'))
    await expect(deleteNodeModules(project())).rejects.toThrow('EPERM')
  })
})

describe('guardExists', () => {
  let dir: string
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'tidy-guard-'))
  })
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('passes (null) when node_modules exists on disk', async () => {
    const nm = join(dir, 'node_modules')
    await mkdir(nm)
    expect(guardExists(nm)).toBeNull()
  })

  it('blocks as unmounted when the path vanished since the scan', () => {
    expect(guardExists(join(dir, 'node_modules'))).toEqual({ freed: 0, blocked: 'unmounted' })
  })
})

describe('revealInFinder', () => {
  it('reveals the node_modules folder itself', () => {
    revealInFinder(project())
    expect(mocks.showItemInFolder).toHaveBeenCalledWith('/Users/me/code/demo/node_modules')
  })
})

describe('openProject', () => {
  it('opens in VS Code when available', async () => {
    await openProject(project())
    expect(mocks.openPath).not.toHaveBeenCalled()
  })

  it('falls back to Finder when the editor launch fails', async () => {
    mocks.execFileFails.value = true
    await openProject(project())
    expect(mocks.openPath).toHaveBeenCalledWith('/Users/me/code/demo')
  })
})
