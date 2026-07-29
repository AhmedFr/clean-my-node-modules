import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Wrap } from './Wrap'

const meta = {
  title: 'Primitives/Wrap',
  component: Wrap,
  parameters: { layout: 'fullscreen' },
  args: {
    children: (
      <div className="bg-white/10 py-8 text-center text-white">
        Content column (1160px, 28px gutters)
      </div>
    ),
  },
} satisfies Meta<typeof Wrap>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
