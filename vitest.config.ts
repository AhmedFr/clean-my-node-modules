import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // only this checkout's sources — keeps temporary worktrees under .claude/ out of runs
    include: ['src/**/*.test.ts'],
  },
})
