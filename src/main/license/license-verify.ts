import { createPublicKey, verify } from 'node:crypto'
import { LICENSE_PUBLIC_KEY_PEM } from './license.constants'

export interface LicensePayload {
  email: string
  issuedAt: number
}

const PREFIX = 'TIDY-'

/**
 * Parses and signature-checks a license key. Returns the signed payload,
 * or null for anything that isn't a genuinely issued key. Never throws.
 */
export function parseLicenseKey(key: unknown, publicKeyPem: string = LICENSE_PUBLIC_KEY_PEM): LicensePayload | null {
  if (typeof key !== 'string') return null
  const trimmed = key.trim()
  if (!trimmed.startsWith(PREFIX)) return null
  const parts = trimmed.slice(PREFIX.length).split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null
  try {
    const payload = Buffer.from(parts[0], 'base64url')
    const signature = Buffer.from(parts[1], 'base64url')
    if (!verify(null, payload, createPublicKey(publicKeyPem), signature)) return null
    const data: unknown = JSON.parse(payload.toString('utf8'))
    if (typeof data !== 'object' || data === null) return null
    const { e, t } = data as { e?: unknown; t?: unknown }
    if (typeof e !== 'string' || typeof t !== 'number') return null
    return { email: e, issuedAt: t }
  } catch {
    return null
  }
}
