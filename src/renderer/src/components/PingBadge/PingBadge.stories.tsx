import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { UIIcon } from '../UIIcon'
import { PingBadge } from './PingBadge'

const meta = {
  title: 'Primitives/PingBadge',
  component: PingBadge,
  args: { icon: UIIcon.checkCircle, accent: ACCENT },
} satisfies Meta<typeof PingBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Good: Story = { args: { tone: 'good' } }
export const Accent: Story = { args: { tone: 'accent' } }
