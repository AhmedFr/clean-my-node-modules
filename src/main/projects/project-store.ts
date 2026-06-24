import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Project } from '@shared/project.types'
import { app } from 'electron'

interface CacheShape {
  projects: Project[]
  lastScanTime: number
}

type Listener = (projects: Project[]) => void

/** In-memory project inventory with a JSON cache for instant launch state. */
export class ProjectStore {
  private projects: Project[] = []
  private lastScan = 0
  private listeners = new Set<Listener>()

  constructor(private filePath = join(app.getPath('userData'), 'projects-cache.json')) {
    this.load()
  }

  get all(): Project[] {
    return [...this.projects]
  }

  get lastScanTime(): number {
    return this.lastScan
  }

  replaceAll(projects: Project[]): void {
    this.projects = projects
    this.lastScan = Date.now()
    this.persist()
    this.emit()
  }

  remove(id: string): Project | undefined {
    const project = this.projects.find((p) => p.id === id)
    if (!project) return undefined
    this.projects = this.projects.filter((p) => p.id !== id)
    this.persist()
    this.emit()
    return project
  }

  totalSize(): number {
    return this.projects.reduce((acc, p) => acc + p.size, 0)
  }

  onChange(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.all)
  }

  private load(): void {
    try {
      const raw = JSON.parse(readFileSync(this.filePath, 'utf8')) as CacheShape
      // Pre-split caches have no uniqueSize; leave it undefined (= unknown) so
      // the UI can prompt a rescan instead of pretending the split is 0.
      this.projects = raw.projects ?? []
      this.lastScan = raw.lastScanTime ?? 0
    } catch {
      this.projects = []
      this.lastScan = 0
    }
  }

  private persist(): void {
    try {
      mkdirSync(dirname(this.filePath), { recursive: true })
      const cache: CacheShape = { projects: this.projects, lastScanTime: this.lastScan }
      writeFileSync(this.filePath, JSON.stringify(cache))
    } catch (err) {
      console.error('Failed to persist project cache', err)
    }
  }
}
