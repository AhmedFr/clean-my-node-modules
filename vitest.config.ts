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
    coverage: {
      provider: 'v8',
      // *.ts only: .tsx (UI) is Storybook's domain and intentionally unmeasured
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.types.ts',
        'src/**/*.d.ts',
        // barrels and bootstrap wiring (src/main/index.ts, src/preload/index.ts)
        'src/**/index.ts',
        'src/renderer/src/test/**',
      ],
      reporter: ['text', 'json-summary'],
    },
  },
})
