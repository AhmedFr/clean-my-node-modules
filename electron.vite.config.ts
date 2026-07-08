import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: { '@shared': resolve('src/shared') },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: { '@shared': resolve('src/shared') },
    },
  },
  renderer: {
    plugins: [react()],
    // Pin the dev server to a fixed loopback port. Vite's default 5173 collides
    // with other local tools (e.g. Docker publishing 5173); when that happens Vite
    // silently falls back to another port while the Electron renderer URL can still
    // resolve to the squatted 5173, loading foreign/stale content and rendering a
    // blank window. strictPort fails loudly instead of silently mismatching.
    server: {
      host: '127.0.0.1',
      port: 5199,
      strictPort: true,
    },
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@renderer': resolve('src/renderer/src'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          panel: resolve('src/renderer/panel.html'),
          launcher: resolve('src/renderer/launcher.html'),
        },
      },
    },
  },
})
