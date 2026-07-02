/**
 * Ed25519 public key that license signatures are verified against.
 * The matching private key lives OUTSIDE the repo (.license-signing.pem,
 * gitignored) — see scripts/license/make-keypair.mjs.
 */
export const LICENSE_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAqyi/+HYDzOjJFZoOafLl3/2liTdXWMDwgzlJdOIWEh4=
-----END PUBLIC KEY-----`
