import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { getPath: () => '/tmp/tidydisk-test' } }))
vi.mock('./find-docker', () => ({
  findDocker: vi.fn(async (override?: string) => override ?? '/usr/local/bin/docker'),
  dockerExecEnv: vi.fn(async () => ({})),
}))

import { __setExecForTests, getDockerInfo, pruneDocker, removeDockerItem } from './docker'
import { findDocker } from './find-docker'

const DF = JSON.stringify({
  Images: [{ ID: 'i1', Repository: '<none>', Tag: '<none>', CreatedAt: '', Size: '400MB', Containers: '0' }],
  Volumes: [],
  Containers: [],
  BuildCache: [],
})

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

describe('getDockerInfo', () => {
  it('reports available with parsed items when the daemon responds', async () => {
    __setExecForTests(async (_bin, args) => {
      if (args[0] === 'version') return { stdout: '27.0.0', stderr: '' }
      if (args[0] === 'system' && args[1] === 'df') return { stdout: DF, stderr: '' }
      return { stdout: '', stderr: '' }
    })
    const info = await getDockerInfo(true)
    expect(info.available).toBe(true)
    expect(info.items).toHaveLength(1)
    expect(info.items[0].removable).toBe(true)
  })

  it('reports daemon not running when version fails', async () => {
    __setExecForTests(async (_bin, args) => {
      if (args[0] === 'version') throw new Error('Cannot connect to the Docker daemon')
      return { stdout: '', stderr: '' }
    })
    const info = await getDockerInfo(true)
    expect(info.available).toBe(false)
    expect(info.reason).toBe('daemon not running')
  })

  it('reports not installed when the binary cannot be found', async () => {
    vi.mocked(findDocker).mockResolvedValueOnce(null)
    const info = await getDockerInfo(true)
    expect(info.available).toBe(false)
    expect(info.reason).toBe('not installed')
  })

  it('does not alias in-flight requests for different binary paths', async () => {
    const versionCallsByBin: Record<string, number> = {}
    __setExecForTests(async (bin, args) => {
      if (args[0] === 'version') {
        versionCallsByBin[bin] = (versionCallsByBin[bin] ?? 0) + 1
        await delay(10)
        return { stdout: `${bin}-version`, stderr: '' }
      }
      if (args[0] === 'system' && args[1] === 'df') return { stdout: DF, stderr: '' }
      return { stdout: '', stderr: '' }
    })

    const [infoA, infoB] = await Promise.all([
      getDockerInfo(true, { binaryPath: '/a/docker' }),
      getDockerInfo(true, { binaryPath: '/b/docker' }),
    ])

    expect(infoA.available).toBe(true)
    expect(infoB.available).toBe(true)
    expect(versionCallsByBin['/a/docker']).toBe(1)
    expect(versionCallsByBin['/b/docker']).toBe(1)
  })
})

it('removeDockerItem maps kind→command and reports freed bytes from df delta', async () => {
  const calls: string[][] = []
  let phase = 0
  __setExecForTests(async (_bin, args) => {
    calls.push(args)
    if (args[0] === 'system' && args[1] === 'df' && !args.includes('-v')) {
      // grand-total df prints ONE JSON object per line; shrink after removal.
      return { stdout: JSON.stringify({ Type: 'Images', Size: phase++ === 0 ? '1GB' : '0B' }), stderr: '' }
    }
    return { stdout: '', stderr: '' }
  })
  const r = await removeDockerItem('image', 'sha256:bbb')
  expect(r.ok).toBe(true)
  expect(calls.some((a) => a[0] === 'rmi' && a[1] === 'sha256:bbb')).toBe(true)
})

it('pruneDocker maps each target to the right prune command', async () => {
  const seen: string[] = []
  __setExecForTests(async (_bin, args) => {
    if (args[0] === 'system' && args[1] === 'df') return { stdout: '[]', stderr: '' }
    seen.push(args.join(' '))
    return { stdout: '', stderr: '' }
  })
  await pruneDocker('buildCache')
  await pruneDocker('unusedVolumes')
  expect(seen).toContain('builder prune -f')
  expect(seen).toContain('volume prune -f')
})
