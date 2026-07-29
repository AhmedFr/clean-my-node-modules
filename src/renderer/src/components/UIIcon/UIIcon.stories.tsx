import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { UIIcon } from './UIIcon'
import type { UIIconName } from './UIIcon.types'

const NAMES = Object.keys(UIIcon) as UIIconName[]

/** Story-only gallery wrapper — not part of the component's public API. */
function UIIconGallery(): ReactNode {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 20,
        padding: 24,
        background: 'var(--panel-menu, #17181d)',
      }}
    >
      {NAMES.map((name) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            color: 'rgba(255,255,255,0.8)',
          }}
        >
          {UIIcon[name]({ size: 20 })}
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{name}</span>
        </div>
      ))}
    </div>
  )
}

const meta = {
  title: 'Primitives/UIIcon',
  component: UIIconGallery,
  parameters: { panel: false },
} satisfies Meta<typeof UIIconGallery>

export default meta
type Story = StoryObj<typeof meta>

export const Gallery: Story = {}
