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
      // Ratchet: CI (Linux) numbers are authoritative — coverage differs slightly
      // from macOS because platform-dependent branches don't run there. When a PR
      // raises CI coverage, bump these in the same PR. Never lower them.
      thresholds: {
        statements: 75.1,
        branches: 88.5,
        functions: 85.7,
        lines: 75.1,
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
