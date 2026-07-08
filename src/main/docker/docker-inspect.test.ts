import { describe, expect, it } from 'vitest'
import { parseContainerInspect, parseVolumeInspect } from './docker-inspect'

const CONTAINERS = JSON.stringify([
  {
    Id: 'c1abc',
    Image: 'node:20',
    Config: {
      Image: 'node:20',
      Labels: {
        'com.docker.compose.project': 'myapp',
        'com.docker.compose.project.working_dir': '/Users/x/code/myapp',
      },
    },
    Mounts: [{ Type: 'volume', Name: 'myapp_pgdata' }],
  },
  { Id: 'c2def', Image: 'redis:7', Config: { Image: 'redis:7', Labels: {} }, Mounts: [] },
])

describe('parseContainerInspect', () => {
  it('extracts compose project, working_dir, image ref, and named-volume mounts', () => {
    const r = parseContainerInspect(CONTAINERS)
    expect(r[0]).toMatchObject({
      id: 'c1abc',
      imageRef: 'node:20',
      project: 'myapp',
      workingDir: '/Users/x/code/myapp',
      mounts: ['myapp_pgdata'],
    })
    expect(r[1].project).toBeUndefined()
    expect(r[1].mounts).toEqual([])
  })
  it('survives malformed input', () => {
    expect(parseContainerInspect('not json')).toEqual([])
  })
})

describe('parseVolumeInspect', () => {
  it('maps volume name to compose project', () => {
    const json = JSON.stringify([
      { Name: 'myapp_pgdata', Labels: { 'com.docker.compose.project': 'myapp' } },
      { Name: 'loose', Labels: null },
    ])
    const m = parseVolumeInspect(json)
    expect(m.get('myapp_pgdata')).toBe('myapp')
    expect(m.has('loose')).toBe(false)
  })
})
