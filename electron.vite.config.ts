import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

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
