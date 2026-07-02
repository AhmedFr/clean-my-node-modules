/**
 * Ed25519 public key that license signatures are verified against.
 * The matching private key lives OUTSIDE the repo (.license-signing.pem,
 * gitignored) — see scripts/license/make-keypair.mjs.
 */
export const LICENSE_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
REPLACED-IN-TASK-2
-----END PUBLIC KEY-----`
