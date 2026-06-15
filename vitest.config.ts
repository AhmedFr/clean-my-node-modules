import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // mirror the tsconfig path aliases so tests can import shared/renderer code
    alias: {
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@renderer': fileURLToPath(new URL('./src/renderer/src', import.meta.url)),
    },
  },
  test: {
    // only this checkout's sources — keeps temporary worktrees under .claude/ out of runs
    include: ['src/**/*.test.ts'],
  },
})
