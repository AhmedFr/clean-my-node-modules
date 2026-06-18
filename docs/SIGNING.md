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

## CI releases (GitHub Actions)

`.github/workflows/release.yml` builds, signs, notarizes, and uploads a **draft**
release whenever you push a `vX.Y.Z` tag. The built-in `GITHUB_TOKEN` publishes the
release — no personal access token needed.

### One-time: add the repo secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
| --- | --- |
| `CSC_LINK` | base64 of your Developer ID Application `.p12` (see below) |
| `CSC_KEY_PASSWORD` | the password you set when exporting the `.p12` |
| `APPLE_ID` | your Apple Developer Apple ID email |
| `APPLE_APP_SPECIFIC_PASSWORD` | the `notarytool` app-specific password |
| `APPLE_TEAM_ID` | your 10-character Team ID |

**Exporting the certificate to `CSC_LINK`:**

1. Keychain Access → find **Developer ID Application: &lt;your name&gt; (&lt;team id&gt;)**.
2. Right-click → **Export…** → save as a `.p12`, set an export password.
3. Base64 it and copy to the clipboard:
   ```sh
   base64 -i cert.p12 | pbcopy
   ```
4. Paste into the `CSC_LINK` secret; put the export password in `CSC_KEY_PASSWORD`.

### Cutting a release

```sh
pnpm version patch        # 0.1.0 → 0.1.1: bumps package.json, commits, tags v0.1.1
git push --follow-tags    # pushes the commit + tag → triggers the workflow
```

Watch **Actions → Release**. On success a **draft release** with the signed, notarized
arm64 DMG + ZIP (and `latest-mac.yml`) appears under **Releases**. Open it, click
**Generate release notes**, then **Publish**.
