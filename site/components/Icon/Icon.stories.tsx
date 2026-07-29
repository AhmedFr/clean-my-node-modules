import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Icon } from './Icon'
import { SvgSprite } from '../SvgSprite'

// Every <symbol id="..."> defined in SvgSprite.tsx — Icon just references one
// of these by id, so the gallery mirrors that list rather than a prop union.
const ICON_IDS = [
  'logo-module',
  'fw-react',
  'fw-next',
  'fw-vue',
  'fw-svelte',
  'fw-node',
  'fw-expo',
  'i-alert',
  'i-check',
  'i-checkcircle',
  'i-search',
  'i-refresh',
  'i-gear',
  'i-finder',
  'i-trash',
  'i-chev-right',
  'i-arrow-down',
  'i-clock',
  'i-bell',
  'i-calendar',
  'i-code',
  'i-hdd',
  'i-grid',
  'i-download',
  'i-github',
  'i-sun',
  'i-battery',
  'i-power',
  'i-box',
  'i-shield',
  'i-broom',
  'i-sparkles',
  'i-layers',
  'i-docker',
] as const

const meta = {
  title: 'Primitives/Icon',
  component: Icon,
  args: { id: 'i-download' },
  decorators: [
    (Story) => (
      <>
        <SvgSprite />
        <Story />
      </>
    ),
  ],
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { className: 'h-6 w-6' },
}

export const Gallery: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="grid grid-cols-6 gap-4 text-white">
      {ICON_IDS.map((id) => (
        <div
          key={id}
          className="flex flex-col items-center gap-2 rounded-lg border border-white/10 p-3"
        >
          <Icon id={id} className="h-6 w-6" />
          <span className="font-mono text-[10px] text-ink-3">{id}</span>
        </div>
      ))}
    </div>
  ),
}
