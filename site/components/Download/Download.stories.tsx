import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Download } from './Download'
import { SvgSprite } from '../SvgSprite'
import { getDictionary } from '@/lib/i18n'

const meta = {
  title: 'Sections/Download',
  component: Download,
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
} satisfies Meta<typeof Download>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
