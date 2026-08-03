import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { HowItWorks } from './HowItWorks'
import { getDictionary } from '@/lib/i18n'

const meta = {
  title: 'Sections/HowItWorks',
  component: HowItWorks,
  parameters: { layout: 'fullscreen' },
  args: { dict: getDictionary('en') },
} satisfies Meta<typeof HowItWorks>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
