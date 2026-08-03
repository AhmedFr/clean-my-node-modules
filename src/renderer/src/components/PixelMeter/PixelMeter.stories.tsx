import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { PixelMeter } from './PixelMeter'

const meta = {
  title: 'Primitives/PixelMeter',
  component: PixelMeter,
  args: { accent: ACCENT, thresholdGB: 10, trackMaxGB: 30 },
} satisfies Meta<typeof PixelMeter>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = { args: { usedGB: 0 } }
export const UnderThreshold: Story = { args: { usedGB: 4 } }
export const OverThreshold: Story = { args: { usedGB: 18 } }
