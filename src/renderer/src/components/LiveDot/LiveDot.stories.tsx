import type { Meta, StoryObj } from '@storybook/react-vite'
import { LiveDot } from './LiveDot'

const meta = {
  title: 'Primitives/LiveDot',
  component: LiveDot,
} satisfies Meta<typeof LiveDot>

export default meta
type Story = StoryObj<typeof meta>

export const WithPort: Story = { args: { info: { pid: 4821, command: 'pnpm dev', port: 3000 } } }
export const WithoutPort: Story = { args: { info: { pid: 4821, command: 'pnpm dev' } } }
