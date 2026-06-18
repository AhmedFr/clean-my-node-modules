# GitHub release pipeline — design

**Date:** 2026-06-18
**Status:** Approved (pending spec review)
**Branch:** `feat/release-pipeline`

## Goal

A tag-triggered GitHub Actions workflow that builds, **signs, and notarizes** the macOS
app and publishes the artifacts to a GitHub **draft** release — giving the project a
clean, repeatable release cycle. The maintainer reviews the draft and clicks Publish.

## Decisions (from the brainstorm)

- **Trigger:** push a `vX.Y.Z` git tag.
- **Publish target:** a GitHub **draft** release (maintainer reviews + publishes).
- **Architecture:** **arm64 only** (Apple Silicon) — matches the current build; the
  `macos-latest` runner is arm64, so it builds natively.
- **Auth:** the built-in `GITHUB_TOKEN` publishes same-repo releases — **no PAT needed**.
- **Versioning cycle:** `pnpm version <patch|minor|major>` bumps `package.json`, commits,
  and creates the matching `vX.Y.Z` tag atomically.

## Release procedure (what the maintainer does)

```sh
pnpm version patch        # 0.1.0 → 0.1.1: updates package.json, commits, tags v0.1.1
git push --follow-tags    # pushes the commit + tag → triggers release.yml
# A draft release appears in GitHub with the signed DMG + ZIP attached.
# In the GitHub release UI: click "Generate release notes", then Publish.
```

The tag version and `package.json` version stay in lockstep because `pnpm version`
creates both — electron-builder names artifacts and the release from `package.json`.

## The workflow — `.github/workflows/release.yml`

- `on: push: tags: ['v*']`
- `permissions: contents: write` (so `GITHUB_TOKEN` can create the release)
- single job on `macos-latest`:
  1. `actions/checkout@v4`
  2. `pnpm/action-setup@v4`
  3. `actions/setup-node@v4` (node 22, `cache: pnpm`)
  4. `pnpm install --frozen-lockfile`
  5. **guard:** `pnpm typecheck && pnpm test` (catch a bad tag before a 5-minute build)
  6. `pnpm exec electron-vite build`
  7. `pnpm exec electron-builder --mac dmg zip --arm64 --publish always`
- env on the build step (all from repo secrets, except the token):
  - `CSC_LINK`, `CSC_KEY_PASSWORD` — Developer ID Application cert (.p12, base64) + its password
  - `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` — notarization (notarytool)
  - `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` — electron-builder's GitHub publisher

`electron-builder` imports `CSC_LINK` into a temporary keychain automatically, signs with
the hardened runtime + entitlements (already configured), notarizes via `notarize: true`,
and `--publish always` uploads the artifacts to the draft release defined by `build.publish`.

## Config change — `package.json` → `build`

Add:

```json
"publish": { "provider": "github", "releaseType": "draft" }
```

The arm64 `dmg` + `zip` targets also produce `latest-mac.yml`, which is uploaded to the
release. That is the metadata electron-updater would consume later — free to produce now,
even though the app does not auto-update yet.

## Secrets the maintainer adds

Repo → Settings → Secrets and variables → Actions → New repository secret:

| Secret | Value |
| --- | --- |
| `CSC_LINK` | base64 of the exported Developer ID Application `.p12` (`base64 -i cert.p12 \| pbcopy`) |
| `CSC_KEY_PASSWORD` | the password set when exporting the `.p12` |
| `APPLE_ID` | Apple Developer Apple ID email |
| `APPLE_APP_SPECIFIC_PASSWORD` | the `notarytool` app-specific password |
| `APPLE_TEAM_ID` | 10-character Team ID |

Exporting the cert: Keychain Access → find **Developer ID Application: …** → right-click →
Export → `.p12` with a password → `base64 -i cert.p12 | pbcopy` → paste into `CSC_LINK`.

No `GH_TOKEN`/PAT secret is required for same-repo releases.

## Docs

Flesh out the "Later (optional, for CI releases)" section of `docs/SIGNING.md` with the
exact secret list, the cert-export steps, and the `pnpm version` → `git push --follow-tags`
release procedure.

## Unchanged

`pnpm release` (local, via `scripts/release-mac.sh`, `--publish never`) stays as-is for
local signed builds. The existing `ci.yml` (`check` + unsigned `package-macos`) is untouched.

## Out of scope

- App-side auto-update (electron-updater wiring) — separate feature; the pipeline only
  produces the `latest-mac.yml` metadata.
- Universal / Intel builds — arm64 only by decision.
- Changelog automation (semantic-release/changesets) — rely on GitHub's auto-generated
  notes on the draft.

## Testing / verification

CI workflows can't be unit-tested. Verification:

1. Author the YAML carefully; validate structure (and `actionlint` if available locally).
2. The real proof is the maintainer's first `vX.Y.Z` tag run (needs the secrets in place):
   watch the Actions log; on success a **draft release** with the signed, notarized arm64
   DMG/ZIP + `latest-mac.yml` appears, ready to publish.
