// Issues a signed lifetime license key for a buyer.
// Usage: pnpm license:issue buyer@email.com
import { createPrivateKey, sign } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const email = process.argv[2]
if (!email || !email.includes('@')) {
  console.error('Usage: pnpm license:issue buyer@email.com')
  process.exit(1)
}
const keyFile = fileURLToPath(new URL('../../.license-signing.pem', import.meta.url))
const privateKey = createPrivateKey(readFileSync(keyFile, 'utf8'))
const payload = Buffer.from(JSON.stringify({ e: email, t: Math.floor(Date.now() / 1000) }))
const signature = sign(null, payload, privateKey)
console.log(`TIDY-${payload.toString('base64url')}.${signature.toString('base64url')}`)
