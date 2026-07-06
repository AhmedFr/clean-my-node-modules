import { Icon } from "@/components/Icon";
import {
  GlassPanel,
  PanelSep,
  Pico,
  Pill,
  RowMeta,
  SizeLabel,
  UiRow,
} from "@/components/ui-mock";

// Feature 4: the Packages tab, whole-machine dependency inventory.
export function PackagesVisual() {
  return (
    <GlassPanel className="w-full max-w-[480px] overflow-hidden rounded-[14px]">
      <div className="flex items-center gap-[11px] px-[14px] py-[11px]">
        <span className="grid h-6 w-6 flex-none place-items-center rounded-[7px] bg-[linear-gradient(155deg,#ff8585,#d23a3a)] [&_svg]:h-[14px] [&_svg]:w-[14px] [&_svg]:text-white">
          <Icon id="logo-module" />
        </span>
        <div className="ml-auto flex gap-[3px] rounded-[9px] bg-black/25 p-[3px]">
          <span className="rounded-[6px] px-[10px] py-1 text-[11.5px] font-semibold text-ink-3">
            Projects
          </span>
          <span className="rounded-[6px] px-[10px] py-1 text-[11.5px] font-semibold text-ink-3">
            Caches
          </span>
          <span className="rounded-[6px] bg-white/10 px-[10px] py-1 text-[11.5px] font-semibold text-ink">
            Packages
          </span>
        </div>
      </div>
      <PanelSep />
      <div className="flex items-center justify-between px-4 pb-1 pt-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          142 packages · whole machine
        </span>
        <div className="flex gap-[3px]">
          <span className="rounded-[6px] bg-white/8 px-2 py-[3px] text-[11px] font-semibold text-ink">
            Used
          </span>
          <span className="rounded-[6px] px-2 py-[3px] text-[11px] font-semibold text-ink-3">
            Size
          </span>
          <span className="rounded-[6px] px-2 py-[3px] text-[11px] font-semibold text-ink-3">
            Updates
          </span>
        </div>
      </div>
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
        <UiRow>
          <Pico>
            <Icon id="i-box" />
          </Pico>
          <RowMeta name="typescript" sub="9 projects · v5.4.2" />
          <div className="flex flex-none items-center gap-[6px]">
            <Pill tone="upd">↑ 5.7.2</Pill>
            <SizeLabel value="61" unit="MB" />
          </div>
        </UiRow>
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
        <UiRow>
          <Pico>
            <Icon id="i-box" />
          </Pico>
          <RowMeta name="react" sub="11 projects · v18.3.1" />
          <div className="flex flex-none items-center gap-[6px]">
            <SizeLabel value="3.4" unit="MB" />
          </div>
        </UiRow>
      </div>
    </GlassPanel>
  );
}
