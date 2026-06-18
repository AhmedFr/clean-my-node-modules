# GitHub Release Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `vX.Y.Z` git tag triggers a GitHub Actions workflow that builds, signs, and notarizes the arm64 macOS app and uploads the DMG/ZIP to a GitHub draft release.

**Architecture:** One workflow (`.github/workflows/release.yml`) on `macos-latest`; electron-builder does the signing/notarization/publishing driven by a `build.publish` GitHub config and repo secrets. The built-in `GITHUB_TOKEN` publishes same-repo releases. Local `pnpm release` (`--publish never`) and the existing `ci.yml` are untouched.

**Tech Stack:** GitHub Actions, pnpm, electron-vite, electron-builder 25, Apple `notarytool`.

**Spec:** `docs/superpowers/specs/2026-06-18-github-release-pipeline-design.md`

---

## File Structure

- **Modify** `package.json` → `build.publish` — tells electron-builder to publish to a GitHub draft release.
- **Create** `.github/workflows/release.yml` — the tag-triggered build/sign/notarize/publish job.
- **Modify** `docs/SIGNING.md` — replace the stub "CI releases" section with the secrets list, cert-export steps, and release procedure.

No source code or tests change; verification is config validity + the existing test suite still passing + (maintainer-side) a real tagged run.

---

## Task 1: Add the GitHub publish config

**Files:**
- Modify: `package.json` (the `build` object)

- [ ] **Step 1: Add `build.publish`**

In `package.json`, inside `"build"`, add a `"publish"` block right after the `"dmg"` block. Change:

```json
    "dmg": {
      "artifactName": "${productName}-${version}.${ext}"
    },
    "files": [
```

to:

```json
    "dmg": {
      "artifactName": "${productName}-${version}.${ext}"
    },
    "publish": {
      "provider": "github",
      "releaseType": "draft"
    },
    "files": [
```

- [ ] **Step 2: Verify the JSON is valid and formatted**

Run: `node -e "JSON.parse(require('node:fs').readFileSync('package.json','utf8')); console.log('json ok')"`
Expected: `json ok`

Run: `pnpm exec biome check package.json`
Expected: no errors (if it reformats, accept the fix).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "build: publish releases to a GitHub draft release"
```

---

## Task 2: The release workflow

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/release.yml` with exactly:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

# Allow the built-in GITHUB_TOKEN to create the release.
permissions:
  contents: write

jobs:
  release:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck + tests (guard a bad tag before the long build)
        run: pnpm typecheck && pnpm test

      - name: Build renderer + main
        run: pnpm exec electron-vite build

      - name: Build, sign, notarize & publish (arm64 → draft release)
        run: pnpm exec electron-builder --mac dmg zip --arm64 --publish always
        env:
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 2: Validate the YAML parses**

Run: `ruby -ryaml -e "YAML.load_file('.github/workflows/release.yml'); puts 'yaml ok'"`
Expected: `yaml ok`

(Ruby ships with macOS. If `actionlint` is installed, also run `actionlint .github/workflows/release.yml` and expect no errors.)

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "ci: tag-triggered release workflow (sign + notarize → draft release)"
```

---

## Task 3: Document the CI release flow

**Files:**
- Modify: `docs/SIGNING.md` (replace the final "Later (optional, for CI releases)" section)

- [ ] **Step 1: Replace the CI-releases section**

In `docs/SIGNING.md`, replace the section that currently reads:

```markdown
## Later (optional, for CI releases)

When we want GitHub Actions to build releases, the same three values go into repo
secrets, plus the certificate exported as a base64 `.p12` (`CSC_LINK` /
`CSC_KEY_PASSWORD`). Not needed for local releases — ask Claude when you want this.
```

with:

```markdown
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

1. Keychain Access → find **Developer ID Application: <your name> (<team id>)**.
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
```

- [ ] **Step 2: Commit**

```bash
git add docs/SIGNING.md
git commit -m "docs(signing): document the CI release flow + secrets"
```

---

## Task 4: Verification pass

**Files:** none (verification only)

- [ ] **Step 1: Static checks**

Run each and confirm:
- `node -e "JSON.parse(require('node:fs').readFileSync('package.json','utf8')); console.log('ok')"` → `ok`
- `ruby -ryaml -e "YAML.load_file('.github/workflows/release.yml'); puts 'ok'"` → `ok`
- `pnpm typecheck` → clean (the package.json change must not break tooling)
- `pnpm test` → all green
- `pnpm lint` → "No fixes applied" (the single pre-existing biome.json deprecation info is OK)
- `pnpm build` → main + preload + renderer built

- [ ] **Step 2: Note the maintainer-side verification (cannot run here)**

The end-to-end proof requires the repo secrets and a real tag, which only the maintainer
can do. After merge: add the 5 secrets, then `pnpm version patch && git push --follow-tags`,
and confirm the **Release** workflow produces a draft release with the signed DMG.

- [ ] **Step 3: Update STATUS.html**

Add a "GitHub release pipeline" item under "Ship it as a real Mac app" (status `done`),
add a `userActions` entry for adding the 5 repo secrets + cutting the first tagged release,
and append a `log` entry dated today. Commit:

```bash
git add STATUS.html
git commit -m "docs: STATUS — GitHub release pipeline"
```

---

## Self-review notes (author)

- **Spec coverage:** trigger + draft publish (Task 2 `--publish always` + Task 1 `releaseType: draft`); arm64 (`--arm64`); `GITHUB_TOKEN` (Task 2 env); guard job (Task 2 typecheck/test step); secrets + cert export + release procedure (Task 3 docs); local `pnpm release` and `ci.yml` untouched (no task modifies them). All spec sections map to a task.
- **Placeholder scan:** none — every file's full content is inline.
- **Consistency:** secret names (`CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`) are identical in the workflow env (Task 2) and the docs table (Task 3); `build.publish.provider: github` (Task 1) matches `--publish always` (Task 2).
