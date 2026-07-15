import { GB } from '@renderer/lib/format'
import type { DockerInfo } from '@shared/docker.types'
import type { PnpmStoreInfo } from '@shared/pnpm-store.types'
import type { Project } from '@shared/project.types'
import { describe, expect, it } from 'vitest'
import { type PanelAreasInput, panelAreas } from './panelAreas'

const project = (uniqueSize: number): Project => ({
  id: `p${uniqueSize}`,
  name: 'demo',
  path: '~/demo',
  absPath: '/Users/x/demo',
  kind: 'node',
  size: uniqueSize,
  uniqueSize,
  lastUsed: 0,
})

const store = (sizeBytes: number, available = true): PnpmStoreInfo => ({
  available,
  path: '/store',
  displayPath: '~/store',
  sizeBytes,
  checkedAt: 0,
  source: 'pnpm',
  canPrune: true,
})

const docker = (sizeBytes: number, available = true): DockerInfo => ({
  available,
  checkedAt: 0,
  totals: [{ kind: 'image', sizeBytes, reclaimableBytes: 0, count: 1 }],
  items: [],
  projects: [],
})

// 34.8 GB of project-unique bytes + a 6.4 GB store + 23.6 GB of Docker.
const base: PanelAreasInput = {
  projects: [project(34.8 * GB)],
  store: store(6.4 * GB),
  docker: docker(23.6 * GB),
  dockerEnabled: true,
  inventory: null,
  checkUpdates: true,
  thresholdGB: 20,
  cacheThresholdGB: 10,
  dockerThresholdGB: 20,
}

describe('panelAreas hero', () => {
  it('counts every byte once: hero = projects + store + docker', () => {
    // 34.8 + 6.4 (store, once) + 23.6 = 64.8
    expect(panelAreas(base).heroBytes).toBeCloseTo(64.8 * GB, 0)
  })

  it('combined limit sums the three limits', () => {
    expect(panelAreas(base).combinedLimitGB).toBe(50)
    expect(panelAreas(base).areaCount).toBe(3)
  })

  it('drops Docker bytes, limit and area when Docker is disabled', () => {
    const r = panelAreas({ ...base, dockerEnabled: false })
    expect(r.heroBytes).toBeCloseTo(41.2 * GB, 0)
    expect(r.combinedLimitGB).toBe(30)
    expect(r.areaCount).toBe(2)
  })

  it('drops Docker the same way when the daemon is unavailable', () => {
    const r = panelAreas({ ...base, docker: docker(23.6 * GB, false) })
    expect(r.heroBytes).toBeCloseTo(41.2 * GB, 0)
    expect(r.combinedLimitGB).toBe(30)
    expect(r.areaCount).toBe(2)
  })

  it('drops the cache limit and area when no store is available', () => {
    // An unavailable store contributes no bytes, so the hero loses its 6.4 GB too.
    const r = panelAreas({ ...base, store: store(6.4 * GB, false) })
    expect(r.heroBytes).toBeCloseTo(58.4 * GB, 0)
    expect(r.combinedLimitGB).toBe(40)
    expect(r.areaCount).toBe(2)
  })

  it('falls back to apparent size for projects never rescanned', () => {
    const p: Project = { ...project(0), size: 5 * GB, uniqueSize: undefined }
    const r = panelAreas({ ...base, projects: [p], store: store(0), docker: docker(0) })
    expect(r.heroBytes).toBeCloseTo(5 * GB, 0)
  })

  it('scales the meter track past the limit and past usage', () => {
    // 64.8 used vs a 50 GB combined limit: track must clear usage.
    expect(panelAreas(base).trackMaxGB).toBeGreaterThan(64.8)
  })
})
