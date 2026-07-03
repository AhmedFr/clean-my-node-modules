/** What the renderer knows about licensing. */
export interface LicenseState {
  pro: boolean
  /** buyer email from the last successful validation */
  email?: string
  /** epoch ms of the LAST SUCCESSFUL validation (advances on every re-check) */
  activatedAt?: number
  /** a stored license exists but the offline grace window lapsed; reconnecting re-verifies automatically */
  needsReverify?: boolean
}

export type ActivateResult = { ok: true; state: LicenseState } | { ok: false; reason: 'invalid' | 'network' }
