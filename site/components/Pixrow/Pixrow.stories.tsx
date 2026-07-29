import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Pixrow } from './Pixrow'

const meta = {
  title: 'Primitives/Pixrow',
  component: Pixrow,
  args: { cells: 7 },
} satisfies Meta<typeof Pixrow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { mirror: false } }
export const Mirrored: Story = { args: { mirror: true } }
