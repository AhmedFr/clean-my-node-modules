import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Btn } from './Btn'

const meta = {
  title: 'Primitives/Btn',
  component: Btn,
  args: { href: '#', children: 'Download for macOS' },
} satisfies Meta<typeof Btn>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = { args: { variant: 'primary' } }
export const Ghost: Story = { args: { variant: 'ghost' } }
export const Small: Story = { args: { variant: 'primary', size: 'sm' } }
export const Large: Story = { args: { variant: 'primary', size: 'lg' } }
