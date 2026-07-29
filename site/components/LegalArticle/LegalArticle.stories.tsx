import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { LegalArticle } from './LegalArticle'
import { formatPostDate } from '@/app/blog/format-date'
import { getLegal } from '@/lib/legal/get-legal'
import { LEGAL_UPDATED, OWNER } from '@/lib/legal/legal.constants'

const legal = getLegal('en')

const meta = {
  title: 'Legal/LegalArticle',
  component: LegalArticle,
  parameters: { layout: 'fullscreen' },
  args: {
    updatedLabel: legal.updatedLabel,
    updated: formatPostDate(LEGAL_UPDATED, 'en'),
  },
} satisfies Meta<typeof LegalArticle>

export default meta
type Story = StoryObj<typeof meta>

// Mirrors PrivacyPage: the standard doc, no identity card slot.
export const Privacy: Story = {
  args: { doc: legal.privacy },
}

// Mirrors LegalPage: the imprint doc plus the factual identity card slotted
// between the intro and the sections.
export const Imprint: Story = {
  args: {
    doc: legal.imprint,
    children: (
      <dl className="mt-8 flex flex-col gap-3 rounded-[14px] border border-line-2 bg-panel/60 p-6 text-[15.5px] text-ink-2 max560:p-5">
        <div className="grid grid-cols-[120px_1fr] gap-3 max560:grid-cols-1 max560:gap-0">
          <dt className="font-mono text-[13px] uppercase tracking-[0.04em] text-ink-4">
            {legal.imprint.labels.responsible}
          </dt>
          <dd>{OWNER.name}</dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-3 max560:grid-cols-1 max560:gap-0">
          <dt className="font-mono text-[13px] uppercase tracking-[0.04em] text-ink-4">
            {legal.imprint.labels.address}
          </dt>
          <dd>
            {OWNER.addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-3 max560:grid-cols-1 max560:gap-0">
          <dt className="font-mono text-[13px] uppercase tracking-[0.04em] text-ink-4">
            {legal.imprint.labels.email}
          </dt>
          <dd>
            <a className="text-accent hover:underline" href={`mailto:${OWNER.email}`}>
              {OWNER.email}
            </a>
          </dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-3 max560:grid-cols-1 max560:gap-0">
          <dt className="font-mono text-[13px] uppercase tracking-[0.04em] text-ink-4">
            {legal.imprint.labels.siret}
          </dt>
          <dd className="font-mono">{OWNER.siret}</dd>
        </div>
        <div className="grid grid-cols-[120px_1fr] gap-3 max560:grid-cols-1 max560:gap-0">
          <dt className="font-mono text-[13px] uppercase tracking-[0.04em] text-ink-4">
            {legal.imprint.labels.vat}
          </dt>
          <dd>{OWNER.vatNote}</dd>
        </div>
      </dl>
    ),
  },
}
