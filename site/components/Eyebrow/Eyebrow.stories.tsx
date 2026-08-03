import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Eyebrow } from './Eyebrow'

const meta = {
  title: 'Primitives/Eyebrow',
  component: Eyebrow,
  args: { children: 'Free & open source' },
} satisfies Meta<typeof Eyebrow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
