import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { AppIcon } from './AppIcon'

const meta = {
  title: 'Primitives/AppIcon',
  component: AppIcon,
  args: { accent: ACCENT },
} satisfies Meta<typeof AppIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { size: 26 } }
export const Large: Story = { args: { size: 48 } }
