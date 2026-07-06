import { Icon } from "@/components/Icon";
import { PixelMeter } from "@/components/PixelMeter";
import { GlassPanel, PanelSep, RowMeta, UiRow } from "@/components/ui-mock";

const PROJECTS = [
  { fw: "fw-react", name: "legacy-dashboard", path: "~/Code/clients/acme/legacy-dashboard", age: "1 year ago", size: "612", unit: "MB", hl: true },
  { fw: "fw-vue", name: "portfolio-2021", path: "~/Sites/portfolio-2021", age: "1 year ago", size: "284", unit: "MB" },
  { fw: "fw-node", name: "hackathon-bot", path: "~/Code/experiments/hackathon-bot", age: "9 months ago", size: "441", unit: "MB" },
  { fw: "fw-expo", name: "recipe-app-old", path: "~/Code/personal/recipe-app-old", age: "7 months ago", size: "903", unit: "MB" },
  { fw: "fw-next", name: "marketing-site", path: "~/Work/marketing-site", age: "4 months ago", size: "538", unit: "MB" },
  { fw: "fw-svelte", name: "svelte-playground", path: "~/Code/experiments/svelte-playground", age: "2 months ago", size: "209", unit: "MB" },
];

// Feature 2: the launcher window with ranked node_modules folders.
export function LauncherVisual() {
  return (
    <GlassPanel className="w-full max-w-[480px] overflow-hidden rounded-[14px]">
      <div className="flex items-center gap-[11px] px-[14px] py-3">
        <span className="grid h-6 w-6 flex-none place-items-center rounded-[7px] bg-[linear-gradient(155deg,#ff8585,#d23a3a)] [&_svg]:h-[14px] [&_svg]:w-[14px] [&_svg]:text-white">
          <Icon id="logo-module" />
        </span>
        <span className="flex-1 text-[15px] text-ink-4">
          Search node_modules by project or path…
        </span>
        <div className="flex items-center gap-[9px]">
          <span className="text-[13px] font-[650] tabular-nums">5.42 GB</span>
          <PixelMeter used={5.42} threshold={5} cells={16} size="sm" style={{ width: 120 }} />
        </div>
      </div>
      <PanelSep />
      <div className="flex items-center justify-between px-4 pb-1 pt-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          12 folders · reclaimable
        </span>
        <div className="flex gap-[3px]">
          <span className="rounded-[6px] bg-white/8 px-2 py-[3px] text-[11px] font-semibold text-ink">
            Last used
          </span>
          <span className="rounded-[6px] px-2 py-[3px] text-[11px] font-semibold text-ink-3">
            Size
          </span>
          <span className="rounded-[6px] px-2 py-[3px] text-[11px] font-semibold text-ink-3">
            Name
          </span>
        </div>
      </div>
      <div className="flex flex-col px-[6px] py-[5px]">
        {PROJECTS.map((p) => (
          <UiRow key={p.name} highlighted={p.hl}>
            <svg className="h-[26px] w-[26px] flex-none rounded-[7px]" viewBox="0 0 24 24">
              <use href={`#${p.fw}`} />
            </svg>
            <RowMeta name={p.name} sub={p.path} mono />
            <div className="whitespace-nowrap text-[12px] text-ink-3">{p.age}</div>
            <span className="text-[12.5px] font-[650] tabular-nums text-ink-2">
              {p.size}
              <span className="ml-[2px] text-[11px] text-ink-4">{p.unit}</span>
            </span>
          </UiRow>
        ))}
      </div>
    </GlassPanel>
  );
}
