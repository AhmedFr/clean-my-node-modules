import { Icon } from "@/components/Icon";
import { Wrap } from "@/components/Wrap";
import { SectionHead } from "@/components/SectionHead";
import { GRID_ICONS } from "./FeatureGrid.constants";
import type { Dictionary } from "@/lib/i18n";

const DELAY = ["", " d1", " d2"];

export interface FeatureGridProps {
  dict: Dictionary;
}

export function FeatureGrid({ dict }: FeatureGridProps) {
  const grid = dict.grid;
  return (
    <section className="relative pt-[120px]">
      <Wrap>
        <SectionHead kicker={grid.kicker} heading={grid.heading} lead={grid.lead} />
        <div className="mt-[54px] grid grid-cols-3 gap-[18px] max900:grid-cols-1">
          {grid.cards.map((card, i) => (
            <div
              key={card.title}
              className={`reveal${DELAY[i % 3]} rounded-2xl border border-line bg-white/[0.025] p-[26px] transition-[transform,border-color,background] duration-200 hover:-translate-y-1 hover:border-line-2 hover:bg-white/[0.045]`}
            >
              <div className="grid h-[42px] w-[42px] place-items-center rounded-[11px] border border-[rgba(255,99,99,0.2)] bg-[rgba(255,99,99,0.12)] text-accent [&_svg]:h-[21px] [&_svg]:w-[21px]">
                <Icon id={GRID_ICONS[i]} />
              </div>
              <h4 className="mt-[18px] font-display text-[19px] font-bold tracking-[-0.01em]">
                {card.title}
              </h4>
              <p className="mt-2 text-[15px] leading-[1.5] text-ink-3">
                {card.copy}
              </p>
            </div>
          ))}
        </div>
        <div className="reveal mt-[30px] flex flex-wrap items-center justify-center gap-[13px] text-center">
          <span className="rounded-full border border-[rgba(245,177,76,0.3)] bg-[rgba(245,177,76,0.1)] px-[11px] py-1 font-mono text-[11px] font-medium uppercase tracking-[0.05em] text-warn">
            {grid.comingSoonPill}
          </span>
          <p className="text-[15px] text-ink-3">{grid.comingSoonText}</p>
        </div>
      </Wrap>
    </section>
  );
}
