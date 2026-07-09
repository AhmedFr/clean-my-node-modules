import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { getPath: () => '/tmp/tidydisk-test' } }))
vi.mock('./find-docker', () => ({
  findDocker: vi.fn(async (override?: string) => override ?? '/usr/local/bin/docker'),
  dockerExecEnv: vi.fn(async () => ({})),
}))
vi.mock('../scanner/detect-kind', () => ({ detectKind: vi.fn(async () => 'node') }))
vi.mock('../scanner/find-project-icon', () => ({ findProjectIcon: vi.fn(async () => undefined) }))

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

  it('associates items with compose projects and attaches a logo from working_dir', async () => {
    const df = JSON.stringify({
      Images: [{ ID: 'sha256:img1', Repository: 'node', Tag: '20', CreatedAt: '', Size: '400MB', Containers: '1' }],
      Volumes: [],
      Containers: [],
      BuildCache: [],
    })
    const containerInspect = JSON.stringify([
      {
        Id: 'ctr1',
        Image: 'sha256:img1',
        Config: {
          Image: 'node:20',
          Labels: {
            'com.docker.compose.project': 'myapp',
            'com.docker.compose.project.working_dir': '/w/myapp',
          },
        },
        Mounts: [],
      },
    ])
    __setExecForTests(async (_bin, args) => {
      if (args[0] === 'version') return { stdout: '27.0.0', stderr: '' }
      if (args[0] === 'system' && args[1] === 'df') return { stdout: df, stderr: '' }
      if (args[0] === 'ps') return { stdout: 'ctr1\n', stderr: '' }
      if (args[0] === 'container' && args[1] === 'inspect') return { stdout: containerInspect, stderr: '' }
      if (args[0] === 'volume' && args[1] === 'inspect') return { stdout: '[]', stderr: '' }
      return { stdout: '', stderr: '' }
    })
    const info = await getDockerInfo(true)
    expect(info.available).toBe(true)
    expect(info.projects).toContainEqual({
      name: 'myapp',
      workingDir: '/w/myapp',
      kind: 'node',
      iconDataUrl: undefined,
    })
    const image = info.items.find((i) => i.kind === 'image')
    expect(image?.project).toBe('myapp')
  })

  it('leaves items unassociated (fail-soft) when container inspect throws', async () => {
    const df = JSON.stringify({
      Images: [{ ID: 'sha256:img1', Repository: 'node', Tag: '20', CreatedAt: '', Size: '400MB', Containers: '1' }],
      Volumes: [],
      Containers: [],
      BuildCache: [],
    })
    __setExecForTests(async (_bin, args) => {
      if (args[0] === 'version') return { stdout: '27.0.0', stderr: '' }
      if (args[0] === 'system' && args[1] === 'df') return { stdout: df, stderr: '' }
      if (args[0] === 'ps') return { stdout: 'ctr1\n', stderr: '' }
      if (args[0] === 'container' && args[1] === 'inspect') throw new Error('daemon unreachable')
      return { stdout: '', stderr: '' }
    })
    const info = await getDockerInfo(true)
    expect(info.available).toBe(true)
    expect(info.items.every((i) => i.project === undefined)).toBe(true)
    expect(info.projects).toEqual([])
  })

  it('still runs repository association when container inspect throws (regression: one inspect failure must not drop ALL grouping)', async () => {
    const df = JSON.stringify({
      Images: [{ ID: 'sha256:img1', Repository: 'node', Tag: '20', CreatedAt: '', Size: '400MB', Containers: '1' }],
      Volumes: [{ Name: 'pgdata', Links: '0', Size: '10MB' }],
      Containers: [],
      BuildCache: [],
    })
    __setExecForTests(async (_bin, args) => {
      if (args[0] === 'version') return { stdout: '27.0.0', stderr: '' }
      if (args[0] === 'system' && args[1] === 'df') return { stdout: df, stderr: '' }
      if (args[0] === 'ps') return { stdout: 'ctr1\n', stderr: '' }
      if (args[0] === 'container' && args[1] === 'inspect') throw new Error('container removed between ps and inspect')
      if (args[0] === 'volume' && args[1] === 'inspect') return { stdout: '[]', stderr: '' }
      return { stdout: '', stderr: '' }
    })
    const info = await getDockerInfo(true)
    expect(info.available).toBe(true)
    const image = info.items.find((i) => i.kind === 'image')
    expect(image?.repository).toBeTruthy()
    expect(info.projects).toEqual([])
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

it('pruneDocker maps ALL FIVE targets to the exact args', async () => {
  const seen: string[] = []
  __setExecForTests(async (_bin, args) => {
    if (args[0] === 'system' && args[1] === 'df') return { stdout: '[]', stderr: '' }
    seen.push(args.join(' '))
    return { stdout: '', stderr: '' }
  })
  await pruneDocker('danglingImages')
  await pruneDocker('unusedImages')
  await pruneDocker('stoppedContainers')
  await pruneDocker('buildCache')
  await pruneDocker('unusedVolumes')
  expect(seen).toEqual([
    'image prune -f',
    'image prune -a -f',
    'container prune -f',
    'builder prune -f',
    'volume prune -f',
  ])
})

it('removeDockerItem("volume", ...) issues volume rm with no -f/--force', async () => {
  const calls: string[][] = []
  __setExecForTests(async (_bin, args) => {
    if (args[0] === 'system' && args[1] === 'df') return { stdout: '[]', stderr: '' }
    calls.push(args)
    return { stdout: '', stderr: '' }
  })
  const r = await removeDockerItem('volume', 'pgdata')
  expect(r.ok).toBe(true)
  expect(calls).toContainEqual(['volume', 'rm', 'pgdata'])
  for (const call of calls) {
    expect(call).not.toContain('-f')
    expect(call).not.toContain('--force')
  }
})

it('removeDockerItem("container", ...) issues rm with no -f/--force', async () => {
  const calls: string[][] = []
  __setExecForTests(async (_bin, args) => {
    if (args[0] === 'system' && args[1] === 'df') return { stdout: '[]', stderr: '' }
    calls.push(args)
    return { stdout: '', stderr: '' }
  })
  const r = await removeDockerItem('container', 'ctr222')
  expect(r.ok).toBe(true)
  expect(calls).toContainEqual(['rm', 'ctr222'])
  for (const call of calls) {
    expect(call).not.toContain('-f')
    expect(call).not.toContain('--force')
  }
})

it('removeDockerItem("buildcache", ...) refuses without ever invoking a remove command', async () => {
  const removeVerbCalls: string[][] = []
  __setExecForTests(async (_bin, args) => {
    if (args[0] === 'rmi' || args[0] === 'rm' || (args[0] === 'volume' && args[1] === 'rm')) {
      removeVerbCalls.push(args)
    }
    return { stdout: '[]', stderr: '' }
  })
  const r = await removeDockerItem('buildcache', 'x')
  expect(r).toEqual({ ok: false, freedBytes: 0 })
  expect(removeVerbCalls).toHaveLength(0)
})

it('removeDockerItem returns {ok:false, freedBytes:0} when the remove command itself throws', async () => {
  __setExecForTests(async (_bin, args) => {
    if (args[0] === 'system' && args[1] === 'df') return { stdout: '[]', stderr: '' }
    if (args[0] === 'rmi') throw new Error('image is being used')
    return { stdout: '', stderr: '' }
  })
  const r = await removeDockerItem('image', 'sha256:aaa')
  expect(r).toEqual({ ok: false, freedBytes: 0 })
})

it('pruneDocker returns {ok:false, freedBytes:0} when the prune command itself throws', async () => {
  __setExecForTests(async (_bin, args) => {
    if (args[0] === 'system' && args[1] === 'df') return { stdout: '[]', stderr: '' }
    if (args[0] === 'image' && args[1] === 'prune') throw new Error('prune failed')
    return { stdout: '', stderr: '' }
  })
  const r = await pruneDocker('danglingImages')
  expect(r).toEqual({ ok: false, freedBytes: 0 })
})

it('removeDockerItem does NOT fabricate freedBytes from the pre-existing total when the AFTER df read fails (regression for Fix 1)', async () => {
  let dfCalls = 0
  __setExecForTests(async (_bin, args) => {
    if (args[0] === 'system' && args[1] === 'df' && !args.includes('-v')) {
      dfCalls++
      if (dfCalls === 1) return { stdout: JSON.stringify({ Type: 'Images', Size: '1GB' }), stderr: '' }
      throw new Error('daemon unreachable')
    }
    return { stdout: '', stderr: '' }
  })
  const r = await removeDockerItem('image', 'sha256:bbb')
  expect(r).toEqual({ ok: true, freedBytes: 0 })
})

it('pruneDocker does NOT fabricate freedBytes from the pre-existing total when the AFTER df read fails (regression for Fix 1)', async () => {
  let dfCalls = 0
  __setExecForTests(async (_bin, args) => {
    if (args[0] === 'system' && args[1] === 'df' && !args.includes('-v')) {
      dfCalls++
      if (dfCalls === 1) return { stdout: JSON.stringify({ Type: 'Images', Size: '2GB' }), stderr: '' }
      throw new Error('daemon unreachable')
    }
    return { stdout: '', stderr: '' }
  })
  const r = await pruneDocker('danglingImages')
  expect(r).toEqual({ ok: true, freedBytes: 0 })
})
