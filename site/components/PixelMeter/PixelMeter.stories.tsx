import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { PixelMeter } from './PixelMeter'

const meta = {
  title: 'Primitives/PixelMeter',
  component: PixelMeter,
  args: { used: 6, threshold: 10 },
} satisfies Meta<typeof PixelMeter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { size: 'md' } }
export const Small: Story = { args: { size: 'sm' } }
export const OverThreshold: Story = { args: { used: 13, threshold: 10 } }
