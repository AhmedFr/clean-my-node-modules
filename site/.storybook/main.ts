import type { StorybookConfig } from '@storybook/nextjs-vite'

const config: StorybookConfig = {
  framework: '@storybook/nextjs-vite',
  stories: [
    '../docs/storybook/**/*.mdx',
    '../components/**/*.stories.tsx',
  ],
  addons: ['@storybook/addon-docs'],
}
export default config
