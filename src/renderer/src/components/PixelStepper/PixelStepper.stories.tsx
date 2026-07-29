import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { PixelStepper } from './PixelStepper'

const meta = {
  title: 'Primitives/PixelStepper',
  component: PixelStepper,
  args: { accent: ACCENT, onChange: () => {} },
} satisfies Meta<typeof PixelStepper>

export default meta
type Story = StoryObj<typeof meta>

export const Low: Story = { args: { valueGB: 2 } }
export const Mid: Story = { args: { valueGB: 5 } }
export const High: Story = { args: { valueGB: 9 } }
