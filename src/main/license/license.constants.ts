/**
 * Polar organization the app validates license keys against (public by design).
 * Overridable for sandbox testing: the sandbox environment has its OWN org id,
 * so switching needs both env vars together, e.g.
 *   POLAR_API_BASE=https://sandbox-api.polar.sh \
 *   POLAR_ORGANIZATION_ID=<sandbox-org-id> pnpm dev
 */
export const POLAR_ORGANIZATION_ID = process.env.POLAR_ORGANIZATION_ID ?? '01bea117-0916-42e2-ab77-beaaa1b1d845'

/** Overridable for the Polar sandbox (see POLAR_ORGANIZATION_ID above). */
export const POLAR_API_BASE = process.env.POLAR_API_BASE ?? 'https://api.polar.sh'

/** Pro survives this long offline after the last successful validation. */
export const GRACE_DAYS = 30

/** Re-validate silently in the background once the last check is older than this. */
export const REVALIDATE_AFTER_DAYS = 7
