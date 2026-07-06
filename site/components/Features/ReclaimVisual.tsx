import { Icon } from "@/components/Icon";
import { PixelMeter } from "@/components/PixelMeter";

// Feature 3: before/after meters and the reclaimed total.
export function ReclaimVisual() {
  return (
    <div className="flex w-full max-w-[420px] flex-col gap-4">
      <div className="rounded-[14px] border border-line bg-white/3 px-[18px] py-4">
        <div className="mb-[11px] flex items-baseline justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-ink-3">
            Before
          </span>
          <span className="whitespace-nowrap font-display text-[19px] font-bold tabular-nums text-accent">
            5.42 GB
          </span>
        </div>
        <PixelMeter used={5.42} threshold={5} cells={20} size="sm" />
      </div>
      <div className="grid place-items-center text-ink-4 [&_svg]:h-[22px] [&_svg]:w-[22px]">
        <Icon id="i-arrow-down" />
      </div>
      <div className="rounded-[14px] border border-line bg-white/3 px-[18px] py-4">
        <div className="mb-[11px] flex items-baseline justify-between">
          <span className="text-[12px] font-semibold uppercase tracking-[0.05em] text-ink-3">
            After
          </span>
          <span className="whitespace-nowrap font-display text-[19px] font-bold tabular-nums text-ok">
            2.71 GB
          </span>
        </div>
        <PixelMeter used={2.71} threshold={5} cells={20} size="sm" />
      </div>
      <div className="text-center text-[14px] font-semibold text-ok">
        + 2.71 GB reclaimed in one sweep
      </div>
    </div>
  );
}
