import type { Meta, StoryObj } from '@storybook/react-vite'
import { ACCENT } from '../../../../../.storybook/constants'
import { RescanHint } from './RescanHint'

const meta = {
  title: 'Rows/RescanHint',
  component: RescanHint,
  args: {
    accent: ACCENT,
    onRescan: () => {},
  },
} satisfies Meta<typeof RescanHint>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
