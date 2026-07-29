import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SectionHead } from './SectionHead'

const meta = {
  title: 'Primitives/SectionHead',
  component: SectionHead,
  args: {
    kicker: 'Features',
    heading: 'Everything you need, nothing you do not',
  },
} satisfies Meta<typeof SectionHead>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithLead: Story = {
  args: {
    lead: 'A short supporting sentence that sits under the heading and above the section content.',
  },
}
