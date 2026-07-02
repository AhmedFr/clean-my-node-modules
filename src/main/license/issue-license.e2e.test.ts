import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseLicenseKey } from './license-verify'

// End-to-end pin: runs the real issuance script (scripts/license/issue-license.mjs)
// against the local .license-signing.pem and verifies the output with
// parseLicenseKey's DEFAULT bundled LICENSE_PUBLIC_KEY_PEM (no override passed).
// This is the one test that proves the issuance tooling and the bundled public
// key in license.constants.ts are actually a matching pair — everything else in
// this suite verifies parseLicenseKey against a throwaway keypair.
//
// .license-signing.pem is intentionally gitignored and never committed (this repo
// is public), so it does not exist in CI or on a fresh clone. This test skips
// itself when the key is absent rather than failing the suite; it only exercises
// for real on a machine that holds the actual signing key (e.g. the maintainer's).
const keyFile = path.resolve(__dirname, '../../../.license-signing.pem')

describe('license issuance (e2e)', () => {
  it.skipIf(!existsSync(keyFile))('issues a key that verifies against the bundled public key', () => {
    const scriptPath = path.resolve(__dirname, '../../../scripts/license/issue-license.mjs')
    const output = execFileSync('node', [scriptPath, 'e2e@test.dev'], { encoding: 'utf8' })
    const key = output.trim()

    const payload = parseLicenseKey(key)

    expect(payload).not.toBeNull()
    expect(payload?.email).toBe('e2e@test.dev')
  })
})
