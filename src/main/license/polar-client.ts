import { net } from 'electron'
import { POLAR_API_BASE, POLAR_ORGANIZATION_ID } from './license.constants'

export type PolarValidation = { ok: true; email?: string } | { ok: false; reason: 'invalid' | 'network' }

/** Minimal JSON POST, injectable for tests. */
export type PostJson = (url: string, body: unknown) => Promise<{ status: number; json: unknown }>

const REQUEST_TIMEOUT_MS = 8000

const postJson: PostJson = async (url, body) => {
  const res = await net.fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  let json: unknown = null
  try {
    json = await res.json()
  } catch {
    // non-JSON error bodies are fine; status carries the verdict
  }
  return { status: res.status, json }
}

/**
 * Validates a license key against Polar's public customer-portal endpoint.
 * 404/422 or a non-granted status mean the key is bad; transport failures and
 * 5xx mean "can't tell right now" so the caller can fall back to cached state.
 * Never throws.
 */
export async function validateLicenseKey(key: string, post: PostJson = postJson): Promise<PolarValidation> {
  try {
    const { status, json } = await post(`${POLAR_API_BASE}/v1/customer-portal/license-keys/validate`, {
      key,
      organization_id: POLAR_ORGANIZATION_ID,
    })
    if (status === 404 || status === 422) return { ok: false, reason: 'invalid' }
    if (status !== 200) return { ok: false, reason: 'network' }
    const data = json as { status?: unknown; customer?: { email?: unknown } } | null
    if (data?.status !== 'granted') return { ok: false, reason: 'invalid' }
    return { ok: true, email: typeof data.customer?.email === 'string' ? data.customer.email : undefined }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
