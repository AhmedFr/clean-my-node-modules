/** Polar organization the app validates license keys against (public by design). */
export const POLAR_ORGANIZATION_ID = '01bea117-0916-42e2-ab77-beaaa1b1d845'

/** Overridable for the Polar sandbox (POLAR_API_BASE=https://sandbox-api.polar.sh). */
export const POLAR_API_BASE = process.env.POLAR_API_BASE ?? 'https://api.polar.sh'

/** Pro survives this long offline after the last successful validation. */
export const GRACE_DAYS = 30

/** Re-validate silently in the background once the last check is older than this. */
export const REVALIDATE_AFTER_DAYS = 7
