import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { StatementBand } from './StatementBand'
import { getDictionary } from '@/lib/i18n'

const meta = {
  title: 'Sections/StatementBand',
  component: StatementBand,
  parameters: { layout: 'fullscreen' },
  args: { dict: getDictionary('en') },
} satisfies Meta<typeof StatementBand>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
