import { describe, expect, it } from 'vitest'
import { parseContainerInspect, parseVolumeLabels } from './docker-inspect'

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

describe('parseVolumeLabels', () => {
  it('maps volume name to compose project from `name::project` lines, skipping unlabeled/blank/malformed lines', () => {
    const out = 'a::proj1\nb::\nc::proj2'
    const m = parseVolumeLabels(out)
    expect(m).toEqual(
      new Map([
        ['a', 'proj1'],
        ['c', 'proj2'],
      ]),
    )
  })

  it('ignores blank lines', () => {
    const m = parseVolumeLabels('a::proj1\n\n\nc::proj2\n')
    expect(m).toEqual(
      new Map([
        ['a', 'proj1'],
        ['c', 'proj2'],
      ]),
    )
  })

  it('ignores lines with no `::` separator', () => {
    const m = parseVolumeLabels('a::proj1\nmalformed-line\nc::proj2')
    expect(m).toEqual(
      new Map([
        ['a', 'proj1'],
        ['c', 'proj2'],
      ]),
    )
  })

  it('splits on the FIRST `::` only, so a project value containing `::` is preserved', () => {
    const m = parseVolumeLabels('a::proj::withcolon')
    expect(m.get('a')).toBe('proj::withcolon')
  })

  it('returns an empty map for empty input', () => {
    expect(parseVolumeLabels('')).toEqual(new Map())
  })
})
