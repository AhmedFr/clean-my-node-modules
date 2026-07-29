import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Icon } from '../Icon'
import { SvgSprite } from '../SvgSprite'
import {
  GlassPanel,
  PanelSep,
  Pico,
  Pill,
  RowMeta,
  SizeLabel,
  UiRow,
} from './index'

// ui-mock is a set of small pieces that compose into the fake app panel used
// on the landing page (see Features/PackagesVisual, Hero/HeroPanel). They
// share one meta/title here rather than one file per piece.
const meta = {
  title: 'UI Mock/GlassPanel',
  component: GlassPanel,
  decorators: [
    (Story) => (
      <>
        <SvgSprite />
        <Story />
      </>
    ),
  ],
  args: {
    children: (
      <div className="w-[300px] p-4 text-sm text-ink-2">Glass panel content</div>
    ),
  },
} satisfies Meta<typeof GlassPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const PanelSepStory: Story = {
  name: 'PanelSep',
  render: () => (
    <div className="w-[300px]">
      <div className="p-3 text-sm text-ink-2">Above</div>
      <PanelSep />
      <div className="p-3 text-sm text-ink-2">Below</div>
    </div>
  ),
}

export const PicoStory: Story = {
  name: 'Pico',
  render: () => (
    <div className="flex items-center gap-4">
      <Pico>
        <Icon id="i-box" />
      </Pico>
      <Pico sev>
        <Icon id="i-shield" />
      </Pico>
      <Pico small>
        <Icon id="i-box" />
      </Pico>
      <Pico sev small>
        <Icon id="i-shield" />
      </Pico>
    </div>
  ),
}

export const PillStory: Story = {
  name: 'Pill',
  render: () => (
    <div className="flex items-center gap-2">
      <Pill tone="sev">
        <Icon id="i-alert" />
        high
      </Pill>
      <Pill tone="unify">unify</Pill>
      <Pill tone="upd">↑ 5.7.2</Pill>
    </div>
  ),
}

export const RowMetaStory: Story = {
  name: 'RowMeta',
  render: () => (
    <div className="flex w-[260px] flex-col gap-3">
      <RowMeta name="lodash" sub="14 projects · 3 versions" />
      <RowMeta name="lodash" sub="/Users/dev/app/node_modules/lodash" mono />
    </div>
  ),
}

export const SizeLabelStory: Story = {
  name: 'SizeLabel',
  render: () => (
    <div className="flex items-center gap-4">
      <SizeLabel value="22" unit="MB" />
      <SizeLabel value="480" unit="KB" />
      <SizeLabel value="3.4" unit="GB" />
    </div>
  ),
}

export const UiRowStory: Story = {
  name: 'UiRow',
  render: () => (
    <div className="flex w-[300px] flex-col gap-1">
      <UiRow>
        <Pico>
          <Icon id="i-box" />
        </Pico>
        <RowMeta name="typescript" sub="9 projects · v5.4.2" />
      </UiRow>
      <UiRow highlighted>
        <Pico>
          <Icon id="i-box" />
        </Pico>
        <RowMeta name="lodash" sub="14 projects · 3 versions" />
      </UiRow>
    </div>
  ),
}

// A representative composition of all the pieces together, mirroring
// Features/PackagesVisual.tsx.
export const Composed: Story = {
  render: () => (
    <GlassPanel className="w-[420px] overflow-hidden rounded-[14px]">
      <div className="flex flex-col px-[6px] py-[5px]">
        <UiRow highlighted>
          <Pico>
            <Icon id="i-box" />
          </Pico>
          <RowMeta name="lodash" sub="14 projects · 3 versions" />
          <div className="flex flex-none items-center gap-[6px]">
            <Pill tone="unify">unify</Pill>
            <SizeLabel value="22" unit="MB" />
          </div>
        </UiRow>
        <PanelSep />
        <UiRow>
          <Pico sev>
            <Icon id="i-shield" />
          </Pico>
          <RowMeta name="minimatch" sub="6 projects · v3.0.4" />
          <div className="flex flex-none items-center gap-[6px]">
            <Pill tone="sev">
              <Icon id="i-alert" />
              high
            </Pill>
            <SizeLabel value="480" unit="KB" />
          </div>
        </UiRow>
      </div>
    </GlassPanel>
  ),
}
