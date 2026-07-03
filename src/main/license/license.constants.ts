/**
 * Ed25519 public key that license signatures are verified against.
 * The matching private key lives OUTSIDE the repo (.license-signing.pem,
 * gitignored) — see scripts/license/make-keypair.mjs.
 *
 * NOTE: kept alongside the Polar constants below because `license-verify.ts`
 * still imports it (offline Ed25519 path is being retired in a later task,
 * not this one).
 */
export const LICENSE_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAqyi/+HYDzOjJFZoOafLl3/2liTdXWMDwgzlJdOIWEh4=
-----END PUBLIC KEY-----`

/** Polar organization the app validates license keys against (public by design). */
export const POLAR_ORGANIZATION_ID = '01bea117-0916-42e2-ab77-beaaa1b1d845'

/** Overridable for the Polar sandbox (POLAR_API_BASE=https://sandbox-api.polar.sh). */
export const POLAR_API_BASE = process.env.POLAR_API_BASE ?? 'https://api.polar.sh'

/** Pro survives this long offline after the last successful validation. */
export const GRACE_DAYS = 30

/** Re-validate silently in the background once the last check is older than this. */
export const REVALIDATE_AFTER_DAYS = 7
