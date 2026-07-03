import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { ActivateResult, LicenseState } from '@shared/license.types'
import { app } from 'electron'
import { GRACE_DAYS, REVALIDATE_AFTER_DAYS } from './license.constants'
import { validateLicenseKey } from './polar-client'

interface PersistedLicense {
  key: string
  lastValidatedAt: number
  email?: string
}

export type RevalidationOutcome = { changed: boolean; outcome: 'refreshed' | 'revoked' | 'offline' }

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * JSON-file-backed license state in the app's userData directory.
 * `pro` is derived from the last successful Polar validation plus a grace
 * window, so the app keeps working offline for GRACE_DAYS and refunds
 * (revocations) are picked up by the periodic background revalidation.
 */
export class LicenseStore {
  private persisted: PersistedLicense | null

  constructor(
    private filePath = join(app.getPath('userData'), 'license.json'),
    private validate: typeof validateLicenseKey = validateLicenseKey,
    private now: () => number = Date.now,
  ) {
    this.persisted = this.load()
  }

  get(): LicenseState {
    if (!this.persisted) return { pro: false }
    const withinGrace = this.now() - this.persisted.lastValidatedAt <= GRACE_DAYS * DAY_MS
    if (!withinGrace) return { pro: false, needsReverify: true, email: this.persisted.email }
    return { pro: true, email: this.persisted.email, activatedAt: this.persisted.lastValidatedAt }
  }

  async activate(key: unknown): Promise<ActivateResult> {
    if (typeof key !== 'string' || !key.trim()) return { ok: false, reason: 'invalid' }
    const result = await this.validate(key.trim())
    if (!result.ok) return { ok: false, reason: result.reason }
    this.persisted = { key: key.trim(), lastValidatedAt: this.now(), email: result.email }
    this.persist()
    return { ok: true, state: this.get() }
  }

  /**
   * Background refresh once the last check is REVALIDATE_AFTER_DAYS old.
   * Returns null when nothing was due; otherwise reports whether the public
   * state flipped and how the check ended. Network trouble keeps the cached
   * state so an offline user is never punished inside the grace window.
   */
  async revalidateIfStale(): Promise<RevalidationOutcome | null> {
    if (!this.persisted) return null
    if (this.now() - this.persisted.lastValidatedAt < REVALIDATE_AFTER_DAYS * DAY_MS) return null
    const wasPro = this.get().pro
    const result = await this.validate(this.persisted.key)
    if (result.ok) {
      this.persisted = {
        ...this.persisted,
        lastValidatedAt: this.now(),
        email: result.email ?? this.persisted.email,
      }
      this.persist()
      return { changed: this.get().pro !== wasPro, outcome: 'refreshed' }
    }
    if (result.reason === 'invalid') {
      this.persisted = null
      try {
        rmSync(this.filePath, { force: true })
      } catch (err) {
        console.error('Failed to clear license file', err)
      }
      return { changed: wasPro, outcome: 'revoked' }
    }
    return { changed: false, outcome: 'offline' }
  }

  private load(): PersistedLicense | null {
    try {
      const raw = JSON.parse(readFileSync(this.filePath, 'utf8')) as PersistedLicense
      if (typeof raw?.key !== 'string' || typeof raw?.lastValidatedAt !== 'number') return null
      return {
        key: raw.key,
        lastValidatedAt: raw.lastValidatedAt,
        email: typeof raw.email === 'string' ? raw.email : undefined,
      }
    } catch {
      return null
    }
  }

  private persist(): void {
    if (!this.persisted) return
    try {
      mkdirSync(dirname(this.filePath), { recursive: true })
      writeFileSync(this.filePath, JSON.stringify(this.persisted, null, 2))
    } catch (err) {
      console.error('Failed to persist license', err)
    }
  }
}
