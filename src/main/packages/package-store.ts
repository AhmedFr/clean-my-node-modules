import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { PackageInventory } from '@shared/package.types'
import type { Project } from '@shared/project.types'
import type { Settings } from '@shared/settings.types'
import { app } from 'electron'
import { buildInventory } from './build-inventory'

/** In-memory package inventory with a JSON cache, computed on demand. */
export class PackageStore {
  private inventory: PackageInventory | null = null
  private current: Promise<PackageInventory> | null = null

  constructor(private filePath = join(app.getPath('userData'), 'packages-cache.json')) {
    this.load()
  }

  /** Last computed (or cached-from-disk) inventory, or null if never computed. */
  get(): PackageInventory | null {
    return this.inventory
  }

  /**
   * Returns the cached inventory when present, else computes one. `force`
   * recomputes from scratch. Concurrent callers share the in-flight build.
   */
  compute(projects: Project[], settings: Settings, force = false): Promise<PackageInventory> {
    if (!force && this.inventory) return Promise.resolve(this.inventory)
    if (this.current) return this.current
    this.current = this.run(projects, settings).finally(() => {
      this.current = null
    })
    return this.current
  }

  private async run(projects: Project[], settings: Settings): Promise<PackageInventory> {
    const inventory = await buildInventory(projects, settings)
    this.inventory = inventory
    this.persist()
    return inventory
  }

  private load(): void {
    try {
      this.inventory = JSON.parse(readFileSync(this.filePath, 'utf8')) as PackageInventory
    } catch {
      this.inventory = null
    }
  }

  private persist(): void {
    if (!this.inventory) return
    try {
      mkdirSync(dirname(this.filePath), { recursive: true })
      writeFileSync(this.filePath, JSON.stringify(this.inventory))
    } catch (err) {
      console.error('Failed to persist package inventory', err)
    }
  }
}
