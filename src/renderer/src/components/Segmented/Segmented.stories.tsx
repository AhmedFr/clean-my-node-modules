import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { Segmented } from './Segmented'

const OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'Size' },
  { value: 'used', label: 'Used' },
] as const

const meta = {
  title: 'Primitives/Segmented',
  component: Segmented,
  args: { accent: ACCENT, options: [...OPTIONS], value: 'name', onChange: () => {} },
} satisfies Meta<typeof Segmented>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { small: false } }
export const Small: Story = { args: { small: true } }
