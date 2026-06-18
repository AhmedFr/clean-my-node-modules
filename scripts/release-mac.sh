#!/usr/bin/env bash
# Build a signed (+ notarized, when creds are present) macOS DMG + ZIP locally.
#
# Fixes the two snags from running electron-builder bare:
#   1. Loads Apple notarization creds from .env.signing (APPLE_ID,
#      APPLE_APP_SPECIFIC_PASSWORD, APPLE_TEAM_ID) so `notarize: true` can run —
#      electron-builder reads these from the environment, not the file.
#   2. --publish never: build artifacts only; don't try to push a GitHub release
#      (that step needs GH_TOKEN and otherwise fails the whole build at the end).
#
# Usage: pnpm release   (runs `electron-vite build` first, then this script)
set -euo pipefail

if [ -f .env.signing ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.signing
  set +a
else
  echo "note: .env.signing not found — building unsigned/un-notarized." >&2
fi

exec pnpm exec electron-builder --mac dmg zip --publish never
