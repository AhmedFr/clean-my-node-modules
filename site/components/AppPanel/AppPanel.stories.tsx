import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { AppPanel } from './AppPanel'
import { SvgSprite } from '../SvgSprite'

// AppPanel is a fixed-width floating widget (the menu-bar dropdown
// recreation used by app/og/page.tsx), not a full-bleed page section, so it
// keeps the default centered layout rather than `fullscreen` like the other
// stories in this batch.
const meta = {
  title: 'Sections/AppPanel',
  component: AppPanel,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <>
        <SvgSprite />
        <Story />
      </>
    ),
  ],
} satisfies Meta<typeof AppPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
