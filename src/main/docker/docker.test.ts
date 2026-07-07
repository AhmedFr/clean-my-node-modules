import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { getPath: () => '/tmp/tidydisk-test' } }))
vi.mock('./find-docker', () => ({
  findDocker: vi.fn(async () => '/usr/local/bin/docker'),
  dockerExecEnv: vi.fn(async () => ({})),
}))

import { __setExecForTests, getDockerInfo } from './docker'

const DF = JSON.stringify({
  Images: [{ ID: 'i1', Repository: '<none>', Tag: '<none>', CreatedAt: '', Size: '400MB', Containers: '0' }],
  Volumes: [],
  Containers: [],
  BuildCache: [],
})

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
})
