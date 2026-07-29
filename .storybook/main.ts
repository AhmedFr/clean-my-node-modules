import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../docs/storybook/**/*.mdx', '../src/renderer/src/components/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs'],
  async viteFinal(cfg) {
    const { mergeConfig } = await import('vite')
    return mergeConfig(cfg, {
      resolve: {
        // mirror tsconfig/vitest aliases so stories can import shared types
        alias: {
          '@shared': fileURLToPath(new URL('../src/shared', import.meta.url)),
          '@renderer': fileURLToPath(new URL('../src/renderer/src', import.meta.url)),
        },
      },
    })
  },
}
export default config
