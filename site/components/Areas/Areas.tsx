import { Icon } from "@/components/Icon";
import { Wrap } from "@/components/Wrap";
import { SectionHead } from "@/components/SectionHead";
import { PixelMeter } from "@/components/PixelMeter";
import { AREA_ACCENT, AREA_BARS, AREA_ICONS } from "./Areas.constants";
import type { AreasProps } from "./Areas.types";

const DELAY = ["", " d1", " d2", " d3"];

export function Areas({ dict }: AreasProps) {
  const areas = dict.areas;
  return (
    <section className="relative pt-[100px]">
      <Wrap>
        <SectionHead
          kicker={areas.kicker}
          heading={areas.heading}
          lead={areas.lead}
        />
        <div className="mt-[46px] grid grid-cols-4 gap-[18px] max900:grid-cols-2 max560:grid-cols-1">
          {areas.cards.map((card, i) => {
            const bar = AREA_BARS[i];
            return (
              <div
                key={card.title}
                className={`reveal${DELAY[i]} rounded-2xl border p-[22px] transition-[transform,border-color,background] duration-200 hover:-translate-y-1 hover:bg-white/[0.045] ${
                  AREA_ACCENT[i]
                    ? "border-[rgba(255,99,99,0.25)] bg-white/[0.03] hover:border-[rgba(255,99,99,0.4)]"
                    : "border-line bg-white/[0.025] hover:border-line-2"
                }`}
              >
                <div className="grid h-[40px] w-[40px] place-items-center rounded-[11px] border border-[rgba(255,99,99,0.2)] bg-[rgba(255,99,99,0.12)] text-accent [&_svg]:h-[20px] [&_svg]:w-[20px]">
                  <Icon id={AREA_ICONS[i]} />
                </div>
                <h4 className="mt-[15px] font-display text-[18px] font-bold tracking-[-0.01em]">
                  {card.title}
                </h4>
                <p className="mt-[6px] min-h-[60px] text-[14px] leading-[1.45] text-ink-3">
                  {card.copy}
                </p>
                {bar.kind === "size" ? (
                  <PixelMeter
                    used={bar.used}
                    threshold={bar.threshold}
                    cells={18}
                    size="sm"
                    className="mt-[10px]"
                  />
                ) : (
                  <div className="mt-[10px] flex gap-[2px]">
                    <span className="h-[13px] flex-[2] rounded-[2px] bg-[#ff453a]" />
                    <span className="h-[13px] flex-[3] rounded-[2px] bg-[#f5b14c]" />
                    <span className="h-[13px] flex-[2] rounded-[2px] bg-[#ffd60a]" />
                    <span className="h-[13px] flex-[6] rounded-[2px] bg-white/9" />
                  </div>
                )}
                <div className="mt-[8px] font-mono text-[12px] text-ink-3">
                  {bar.label}
                </div>
              </div>
            );
          })}
        </div>
      </Wrap>
    </section>
  );
}
