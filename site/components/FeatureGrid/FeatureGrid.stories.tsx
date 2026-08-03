import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FeatureGrid } from './FeatureGrid'
import { SvgSprite } from '../SvgSprite'
import { getDictionary } from '@/lib/i18n'

const meta = {
  title: 'Sections/FeatureGrid',
  component: FeatureGrid,
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <>
        <SvgSprite />
        <Story />
      </>
    ),
  ],
  args: { dict: getDictionary('en') },
} satisfies Meta<typeof FeatureGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
