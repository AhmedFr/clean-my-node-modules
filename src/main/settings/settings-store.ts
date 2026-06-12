import { app } from 'electron'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Settings } from '@shared/settings.types'
import { DEFAULT_SETTINGS } from '@shared/settings.constants'

type Listener = (settings: Settings) => void

/** JSON-file-backed settings store in the app's userData directory. */
export class SettingsStore {
  private settings: Settings
  private listeners = new Set<Listener>()

  constructor(private filePath = join(app.getPath('userData'), 'settings.json')) {
    this.settings = this.load()
  }

  get(): Settings {
    return { ...this.settings }
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]): Settings {
    this.settings = { ...this.settings, [key]: value }
    this.persist()
    this.listeners.forEach((fn) => fn(this.get()))
    return this.get()
  }

  onChange(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private load(): Settings {
    try {
      const raw = JSON.parse(readFileSync(this.filePath, 'utf8'))
      return { ...DEFAULT_SETTINGS, ...raw }
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  }

  private persist(): void {
    try {
      mkdirSync(dirname(this.filePath), { recursive: true })
      writeFileSync(this.filePath, JSON.stringify(this.settings, null, 2))
    } catch (err) {
      console.error('Failed to persist settings', err)
    }
  }
}
