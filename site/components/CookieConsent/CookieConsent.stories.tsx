import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { CookieConsent } from './CookieConsent'

// CookieConsent reads the locale back out of `usePathname()` (it lives in the
// root layout, above the locale param). @storybook/nextjs-vite only wires up
// the App Router's PathnameContext when `parameters.nextjs.appDirectory` is
// set — without it `usePathname()` returns null and the component throws.
const meta = {
  title: 'Sections/CookieConsent',
  component: CookieConsent,
  parameters: {
    layout: 'fullscreen',
    nextjs: { appDirectory: true, navigation: { pathname: '/' } },
  },
} satisfies Meta<typeof CookieConsent>

export default meta
type Story = StoryObj<typeof meta>

// Shows the banner in its "no choice made yet" state — the only state that
// reads from empty story-storage, and the one worth reviewing visually.
export const Default: Story = {}
