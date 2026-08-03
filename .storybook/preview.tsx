import type { Preview } from '@storybook/react-vite'
import '../src/renderer/src/styles/global.css'
import './storybook.css'

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { disable: true },
  },
  decorators: [
    (Story, ctx) => {
      const framed = ctx.parameters.panel !== false
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            background: 'linear-gradient(160deg, #3c4150 0%, #191a1f 70%)',
          }}
        >
          <div
            style={
              framed
                ? {
                    width: 334,
                    borderRadius: 12,
                    padding: 14,
                    background: 'var(--panel-menu)',
                    boxShadow: 'inset 0 1px 0 var(--surface-2), inset 0 0 0 1px var(--surface-3)',
                  }
                : undefined
            }
          >
            <Story />
          </div>
        </div>
      )
    },
  ],
}
export default preview
