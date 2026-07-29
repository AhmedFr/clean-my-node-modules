import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { SizeViz } from './SizeViz'

const meta = {
  title: 'Rows/SizeViz',
  component: SizeViz,
  args: {
    style: 'bar',
    bytes: 1.5e9,
    apparentBytes: 2e9,
    maxBytes: 3e9,
    stale: 0.4,
    accent: ACCENT,
    density: 'roomy',
  },
} satisfies Meta<typeof SizeViz>

export default meta
type Story = StoryObj<typeof meta>

export const Plain: Story = { args: { style: 'plain' } }
export const Bar: Story = { args: { style: 'bar' } }
export const Ring: Story = { args: { style: 'ring' } }
