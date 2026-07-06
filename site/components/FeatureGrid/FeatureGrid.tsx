import { Icon } from "@/components/Icon";
import { Wrap } from "@/components/Wrap";
import { SectionHead } from "@/components/SectionHead";
import { GRID_CARDS } from "./FeatureGrid.constants";

const DELAY = ["", " d1", " d2"];

export function FeatureGrid() {
  return (
    <section className="relative pt-[120px]">
      <Wrap>
        <SectionHead
          kicker="Everything in one menu"
          heading={
            <>
              Small app. <span className="text-accent">Big relief.</span>
            </>
          }
          lead="Your scans stay on your Mac. Anonymous usage analytics only, with a one-click opt-out in Settings. A quiet utility that keeps your disk honest."
        />
        <div className="mt-[54px] grid grid-cols-3 gap-[18px] max900:grid-cols-1">
          {GRID_CARDS.map((card, i) => (
            <div
              key={card.title}
              className={`reveal${DELAY[i % 3]} rounded-2xl border border-line bg-white/[0.025] p-[26px] transition-[transform,border-color,background] duration-200 hover:-translate-y-1 hover:border-line-2 hover:bg-white/[0.045]`}
            >
              <div className="grid h-[42px] w-[42px] place-items-center rounded-[11px] border border-[rgba(255,99,99,0.2)] bg-[rgba(255,99,99,0.12)] text-accent [&_svg]:h-[21px] [&_svg]:w-[21px]">
                <Icon id={card.icon} />
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
            Coming soon
          </span>
          <p className="text-[15px] text-ink-3">
            npm, yarn &amp; bun caches, plus per-project build outputs like{" "}
            <code>.next</code> and <code>dist</code>.
          </p>
        </div>
      </Wrap>
    </section>
  );
}
