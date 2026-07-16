import { Icon } from "@/components/Icon";
import { PanelSep } from "@/components/ui-mock";
import { PixelMeter } from "@/components/PixelMeter";

const ROWS = [
  { name: "Projects", used: 41.2, threshold: 30, value: "41.2 GB", sev: false },
  { name: "Caches", used: 6.4, threshold: 10, value: "6.4 GB", sev: false },
  { name: "Packages", used: 0, threshold: 1, value: "7 vuln", sev: true },
  { name: "Docker", used: 23.6, threshold: 20, value: "23.6 GB", sev: false },
];

// The hero's recreation of the new read-only menu bar panel dashboard:
// a "Tracked on disk" aggregate plus four click-through area rows.
export function HeroPanel() {
  return (
    <div className="px-[15px] py-[13px]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-ink-3">
        Tracked on disk
      </div>
      <div className="mt-[5px] flex items-center justify-between gap-[10px]">
        <span className="font-display text-[27px] font-bold tracking-[-0.01em] text-white">
          71.2 GB
        </span>
        <span className="whitespace-nowrap font-mono text-[12px] font-semibold text-accent">
          21.2 GB over
        </span>
      </div>
      <PixelMeter used={71.2} threshold={50} cells={32} className="mt-[6px]" />
      <PanelSep />
      <div className="flex flex-col gap-[2px] pt-[6px]">
        {ROWS.map((r) => (
          <div key={r.name} className="flex items-center gap-[10px] px-1 py-[6px]">
            <span className="w-[58px] flex-none text-[12px] font-semibold text-ink-2">
              {r.name}
            </span>
            <span className="min-w-0 flex-1">
              {r.sev ? (
                <span className="flex gap-[2px]">
                  <span className="h-[13px] flex-[2] rounded-[2px] bg-[#ff453a]" />
                  <span className="h-[13px] flex-[3] rounded-[2px] bg-[#f5b14c]" />
                  <span className="h-[13px] flex-[7] rounded-[2px] bg-white/9" />
                </span>
              ) : (
                <PixelMeter used={r.used} threshold={r.threshold} cells={16} size="sm" />
              )}
            </span>
            <span className="flex-none font-mono text-[12px] font-semibold text-ink-2">
              {r.value}
            </span>
            <span className="flex-none text-ink-4 [&_svg]:h-[13px] [&_svg]:w-[13px]">
              <Icon id="i-chev-right" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
