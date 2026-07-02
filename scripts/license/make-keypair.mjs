// One-time Ed25519 keypair generation for license signing.
// Refuses to overwrite an existing key — real buyers' keys depend on it.
import { generateKeyPairSync } from 'node:crypto'
import { existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const keyFile = fileURLToPath(new URL('../../.license-signing.pem', import.meta.url))
if (existsSync(keyFile)) {
  console.error('.license-signing.pem already exists — refusing to overwrite.')
  console.error('Issued licenses are only valid against this exact key. Back it up; never regenerate.')
  process.exit(1)
}
const { publicKey, privateKey } = generateKeyPairSync('ed25519')
writeFileSync(keyFile, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 })
console.log('Private key written to .license-signing.pem (gitignored).')
console.log('BACK IT UP somewhere safe (password manager) — losing it orphans every sold license.\n')
console.log('Paste this into LICENSE_PUBLIC_KEY_PEM in src/main/license/license.constants.ts:\n')
console.log(publicKey.export({ type: 'spki', format: 'pem' }).toString())
