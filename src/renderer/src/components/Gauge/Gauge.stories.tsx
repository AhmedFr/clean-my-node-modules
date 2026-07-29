import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { GB } from '../../lib/format'
import { Gauge } from './Gauge'

const meta = {
  title: 'Primitives/Gauge',
  component: Gauge,
  args: { accent: ACCENT, threshold: 10 * GB },
} satisfies Meta<typeof Gauge>

export default meta
type Story = StoryObj<typeof meta>

export const UnderThreshold: Story = { args: { used: 3.2 * GB } }
export const OverThreshold: Story = { args: { used: 13.5 * GB } }
export const Calculating: Story = { args: { used: 6 * GB, calculating: true } }
export const WithLinkedBytes: Story = { args: { used: 4 * GB, linkedBytes: 2.1 * GB } }
