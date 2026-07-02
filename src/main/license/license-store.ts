import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { ActivateResult, LicenseState } from '@shared/license.types'
import { app } from 'electron'
import { parseLicenseKey } from './license-verify'

/**
 * JSON-file-backed license store in the app's userData directory.
 * Only the signed key is trusted: state is re-derived by verifying the
 * signature on every load, so editing license.json can't unlock the app.
 */
export class LicenseStore {
  private state: LicenseState

  constructor(
    private filePath = join(app.getPath('userData'), 'license.json'),
    private publicKeyPem?: string,
  ) {
    this.state = this.load()
  }

  get(): LicenseState {
    return { ...this.state }
  }

  activate(key: unknown): ActivateResult {
    const payload = parseLicenseKey(key, this.publicKeyPem)
    if (!payload) return { ok: false, reason: 'invalid' }
    const activatedAt = Date.now()
    this.state = { pro: true, email: payload.email, activatedAt }
    this.persist((key as string).trim(), activatedAt)
    return { ok: true, state: this.get() }
  }

  private load(): LicenseState {
    try {
      const raw = JSON.parse(readFileSync(this.filePath, 'utf8')) as { key?: unknown; activatedAt?: unknown }
      const payload = parseLicenseKey(raw.key, this.publicKeyPem)
      if (!payload) return { pro: false }
      return {
        pro: true,
        email: payload.email,
        activatedAt: typeof raw.activatedAt === 'number' ? raw.activatedAt : undefined,
      }
    } catch {
      return { pro: false }
    }
  }

  private persist(key: string, activatedAt: number): void {
    try {
      mkdirSync(dirname(this.filePath), { recursive: true })
      writeFileSync(this.filePath, JSON.stringify({ key, activatedAt }, null, 2))
    } catch (err) {
      console.error('Failed to persist license', err)
    }
  }
}
