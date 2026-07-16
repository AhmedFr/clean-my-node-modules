import { GB } from '@renderer/lib/format'
import type { DockerInfo } from '@shared/docker.types'
import type { PackageEntry, PackageInventory } from '@shared/package.types'
import type { PnpmStoreInfo } from '@shared/pnpm-store.types'
import type { Project } from '@shared/project.types'
import { describe, expect, it } from 'vitest'
import { type PanelAreaRow, type PanelAreasInput, panelAreas } from './panelAreas'

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

const inventory = (packages: PackageEntry[], enrichmentError?: string): PackageInventory => ({
  packages,
  computedAt: 1,
  projectCount: 1,
  ...(enrichmentError ? { enrichmentError } : {}),
})

const pkg = (name: string, severity?: 'critical' | 'high'): PackageEntry => ({
  name,
  usages: [],
  projectCount: 1,
  versions: ['1.0.0'],
  multipleVersions: false,
  ...(severity ? { advisory: { severity, title: 't', vulnerableVersions: '<1' } } : {}),
})

const rowIds = (i: PanelAreasInput): string[] => panelAreas(i).rows.map((r) => r.id)
const row = (i: PanelAreasInput, id: string): PanelAreaRow => {
  const found = panelAreas(i).rows.find((r) => r.id === id)
  if (!found) throw new Error(`no ${id} row`)
  return found
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

describe('panelAreas rows', () => {
  it('lists the four areas in order when everything is present', () => {
    expect(rowIds(base)).toEqual(['projects', 'caches', 'packages', 'docker'])
  })

  it('every size row mirrors its tab headline number', () => {
    const r = base
    // Projects mirrors totalUsed, which INCLUDES the store (34.8 + 6.4).
    expect(row(r, 'projects')).toMatchObject({ kind: 'size', usedBytes: 41.2 * GB, thresholdGB: 20 })
    // Caches mirrors the Caches gauge: the store alone.
    expect(row(r, 'caches')).toMatchObject({ kind: 'size', usedBytes: 6.4 * GB, thresholdGB: 10 })
    expect(row(r, 'docker')).toMatchObject({ kind: 'size', usedBytes: 23.6 * GB, thresholdGB: 20 })
  })

  it('rows exceed the hero by exactly the pnpm store (D4 invariant)', () => {
    const r = panelAreas(base)
    const summed = r.rows.reduce((a, x) => a + (x.kind === 'size' ? x.usedBytes : 0), 0)
    expect(summed - r.heroBytes).toBeCloseTo(6.4 * GB, 0)
  })

  it('each row carries the nav target for its tab', () => {
    expect(row(base, 'projects').nav).toBe('projects')
    expect(row(base, 'caches').nav).toBe('caches')
    expect(row(base, 'packages').nav).toBe('packages')
    expect(row(base, 'docker').nav).toBe('docker')
  })

  it('hides the Docker row when disabled or unavailable', () => {
    expect(rowIds({ ...base, dockerEnabled: false })).toEqual(['projects', 'caches', 'packages'])
    expect(rowIds({ ...base, docker: docker(1 * GB, false) })).toEqual(['projects', 'caches', 'packages'])
  })

  it('hides the Caches row when no store is available', () => {
    expect(rowIds({ ...base, store: store(6.4 * GB, false) })).toEqual(['projects', 'packages', 'docker'])
  })

  it('shows severity once an inventory is cached', () => {
    const r = row({ ...base, inventory: inventory([pkg('a', 'critical'), pkg('b', 'high'), pkg('c')]) }, 'packages')
    expect(r).toMatchObject({ kind: 'severity', packagesTotal: 3 })
    if (r.kind !== 'severity') throw new Error('expected severity')
    expect(r.severity.vulnerable).toBe(2)
    expect(r.severity.critical).toBe(1)
  })

  it('placeholders rather than claiming all clear when never computed', () => {
    expect(row(base, 'packages')).toMatchObject({ kind: 'placeholder', note: 'Not checked yet' })
  })

  it('placeholders when the update check is off', () => {
    const i = { ...base, checkUpdates: false, inventory: inventory([pkg('a')]) }
    expect(row(i, 'packages')).toMatchObject({ kind: 'placeholder' })
  })

  it('placeholders when enrichment failed, so 0 vulns is not shown as all clear', () => {
    const i = { ...base, inventory: inventory([pkg('a')], 'offline') }
    expect(row(i, 'packages')).toMatchObject({ kind: 'placeholder' })
  })

  it('keeps the whole dashboard when there are no projects (D6b)', () => {
    const r = panelAreas({ ...base, projects: [] })
    expect(r.rows.map((x) => x.id)).toEqual(['projects', 'caches', 'packages', 'docker'])
    // Projects still reports the store, which is real disk that projects link to.
    expect(row({ ...base, projects: [] }, 'projects')).toMatchObject({ usedBytes: 6.4 * GB })
  })

  it('formats the value string for size rows', () => {
    expect(row(base, 'docker')).toMatchObject({ value: '23.60 GB' })
  })
})
