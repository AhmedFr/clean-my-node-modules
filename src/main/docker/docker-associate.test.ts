import type { DockerItem } from '@shared/docker.types'
import { describe, expect, it } from 'vitest'
import { associateProjects } from './docker-associate'

const mk = (o: Partial<DockerItem> & Pick<DockerItem, 'id' | 'kind' | 'name'>): DockerItem => ({
  sizeBytes: 0,
  createdAt: 0,
  inUse: false,
  removable: true,
  ...o,
})

describe('associateProjects', () => {
  it('groups a container by its compose project and lists the project', () => {
    const items = [mk({ id: 'c1abc', kind: 'container', name: 'myapp-web' })]
    const containers = [
      {
        id: 'c1abc',
        imageRef: 'node:20',
        imageId: 'sha256:img1',
        project: 'myapp',
        workingDir: '/w/myapp',
        mounts: ['myapp_pgdata'],
      },
    ]
    const { items: out, projects } = associateProjects(items, containers, new Map())
    expect(out[0].project).toBe('myapp')
    expect(projects).toEqual([{ name: 'myapp', workingDir: '/w/myapp' }])
  })

  it('associates an image to the single project whose container uses it (used-by)', () => {
    const items = [mk({ id: 'sha256:img1', kind: 'image', name: 'node:20' })]
    const containers = [
      {
        id: 'c1abc',
        imageRef: 'node:20',
        imageId: 'sha256:img1',
        project: 'myapp',
        workingDir: '/w/myapp',
        mounts: [],
      },
    ]
    const { items: out } = associateProjects(items, containers, new Map())
    expect(out[0].project).toBe('myapp')
    expect(out[0].repository).toBe('node')
  })

  it('leaves an image used by multiple projects unassociated (no double-count)', () => {
    const items = [mk({ id: 'sha256:img1', kind: 'image', name: 'node:20' })]
    const containers = [
      { id: 'a', imageRef: 'node:20', imageId: 'sha256:img1', project: 'app1', workingDir: '/w/a', mounts: [] },
      { id: 'b', imageRef: 'node:20', imageId: 'sha256:img1', project: 'app2', workingDir: '/w/b', mounts: [] },
    ]
    const { items: out } = associateProjects(items, containers, new Map())
    expect(out[0].project).toBeUndefined()
    expect(out[0].repository).toBe('node')
  })

  it('associates a volume by compose label, else by mounting container', () => {
    const items = [
      mk({ id: 'myapp_pgdata', kind: 'volume', name: 'myapp_pgdata' }),
      mk({ id: 'mounted', kind: 'volume', name: 'mounted' }),
    ]
    const containers = [
      { id: 'c1', imageRef: 'x', imageId: 'x', project: 'byMount', workingDir: '/w', mounts: ['mounted'] },
    ]
    const volProjects = new Map([['myapp_pgdata', 'myapp']])
    const { items: out } = associateProjects(items, containers, volProjects)
    expect(out.find((i) => i.name === 'myapp_pgdata')?.project).toBe('myapp')
    expect(out.find((i) => i.name === 'mounted')?.project).toBe('byMount')
  })

  it('build cache and dangling images stay unassociated; repository parsed', () => {
    const items = [mk({ id: 'bc', kind: 'buildcache', name: 'bc' }), mk({ id: 'd', kind: 'image', name: '<none>' })]
    const { items: out } = associateProjects(items, [], new Map())
    expect(out[0].project).toBeUndefined()
    expect(out[1].project).toBeUndefined()
    expect(out[1].repository).toBeUndefined() // '<none>' has no repository
  })
})
