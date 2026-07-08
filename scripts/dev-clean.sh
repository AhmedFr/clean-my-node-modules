#!/usr/bin/env sh
# Clean dev start: kill any stray dev instances, clear caches, then run `pnpm dev`.
# Lives in a file (not the npm script string) so its pkill patterns don't match the
# shell that is running this script.
set -e

# Kill leftover electron-vite dev servers and their Electron children (not this shell).
pkill -f "electron-vite.js" 2>/dev/null || true
pkill -f "clean-my-node-modules/node_modules/.pnpm/electron@" 2>/dev/null || true

# Quit the installed app if it is open — it is a released build, not this dev tree,
# and its tray icon is easy to confuse with dev's.
osascript -e 'quit app "TidyDisk"' 2>/dev/null || true

# Give the OS a moment to release the pinned dev port before Vite rebinds it.
sleep 1

# Clear Vite's optimized-deps cache and the electron-vite build output.
rm -rf node_modules/.vite out

exec pnpm dev
