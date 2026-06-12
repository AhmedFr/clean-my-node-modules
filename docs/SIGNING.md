# Code signing & notarization — what you need to fetch

The build is already wired (hardened runtime, entitlements, `notarize: true`).
It needs **three credentials** from your Apple Developer account. Once they're in
place, `pnpm release` produces a signed + notarized DMG and ZIP. Without them,
`pnpm package` still works and just skips signing.

## 1. Developer ID Application certificate (one-time)

The easiest path is through Xcode:

1. Xcode → **Settings → Accounts** → select your Apple ID → **Manage Certificates…**
2. Click **+** → **Developer ID Application** (NOT "Apple Development" / "Distribution" —
   those are for the App Store).
3. That's it — the certificate and private key land in your login keychain.

No Xcode? Use the web flow: [developer.apple.com/account/resources/certificates](https://developer.apple.com/account/resources/certificates)
→ **+** → Developer ID Application → it will ask for a CSR, which you create with
Keychain Access → Certificate Assistant → "Request a Certificate From a Certificate Authority…".

**Verify it worked:**

```sh
security find-identity -v -p codesigning | grep "Developer ID Application"
```

You should see one line with your name and Team ID. electron-builder discovers it automatically.

## 2. Team ID

[developer.apple.com/account](https://developer.apple.com/account) → scroll to
**Membership details** → **Team ID** (10 characters, e.g. `A1B2C3D4E5`).

## 3. App-specific password (for notarization)

1. [account.apple.com](https://account.apple.com) → **Sign-In and Security** →
   **App-Specific Passwords** → **+**
2. Name it `notarytool`, copy the generated `xxxx-xxxx-xxxx-xxxx` password.

## Where to put them

Create `.env.signing` at the repo root (it is gitignored — never commit it):

```sh
export APPLE_ID="ahmedfr.abouelleil@gmail.com"   # your Apple Developer Apple ID
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="YOURTEAMID"
```

Then release with:

```sh
source .env.signing && pnpm release
```

First notarization takes a few minutes (Apple's queue). Verify the result:

```sh
spctl -a -vv "dist/mac/Clean my node_modules.app"   # → "accepted, source=Notarized Developer ID"
```

## Later (optional, for CI releases)

When we want GitHub Actions to build releases, the same three values go into repo
secrets, plus the certificate exported as a base64 `.p12` (`CSC_LINK` /
`CSC_KEY_PASSWORD`). Not needed for local releases — ask Claude when you want this.
