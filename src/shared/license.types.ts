/** What the renderer knows about licensing. */
export interface LicenseState {
  pro: boolean
  /** buyer email embedded in the key (present when pro) */
  email?: string
  /** epoch ms when the key was activated on this machine */
  activatedAt?: number
}

export type ActivateResult = { ok: true; state: LicenseState } | { ok: false; reason: 'invalid' | 'network' }
