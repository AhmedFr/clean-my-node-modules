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
      // Ratchet: CI fails below these; local coverage runs auto-bump them as tests are added.
      thresholds: {
        autoUpdate: true,
        statements: 75.19,
        branches: 88.52,
        functions: 85.96,
        lines: 75.19,
      },
    },
    projects: [
      {
        extends: true, // inherit root resolve.alias
        test: {
          name: 'node',
          include: ['src/main/**/*.test.ts', 'src/shared/**/*.test.ts', 'src/preload/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'renderer',
          environment: 'jsdom',
          include: ['src/renderer/**/*.test.ts'],
          setupFiles: ['src/renderer/src/test/setup.ts'],
        },
      },
    ],
  },
})
