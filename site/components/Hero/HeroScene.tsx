import { Icon } from "@/components/Icon";
import { HeroPanel } from "./HeroPanel";
import {
  GlassPanel,
  PanelSep,
  Pico,
  Pill,
  RowMeta,
  SizeLabel,
  UiRow,
} from "@/components/ui-mock";

// The hero's faux macOS screen: menu bar, live dropdown recreation, floating
// Packages mini-card, and reclaim toast. `lp-scene-wrap` and `lp-screen` are
// behavior hooks (RevealClient's pointer tilt); `screen-noise` and
// `glass-panel` are residual classes in globals.css.
export function HeroScene() {
  return (
    <div className="lp-scene-wrap reveal d2 relative mx-auto mt-14 max-w-[1080px] px-7">
      <div className="absolute -z-[1] rounded-full bg-[radial-gradient(closest-side,rgba(255,99,99,0.32),rgba(150,60,180,0.14)_60%,transparent)] blur-[50px] [inset:-8%_6%_18%]" />
      <div className="lp-screen screen-noise relative aspect-[16/10] overflow-hidden rounded-[18px] border border-line-2 bg-[radial-gradient(700px_380px_at_78%_4%,#3a2440_0%,transparent_58%),radial-gradient(620px_420px_at_6%_96%,#123038_0%,transparent_55%),linear-gradient(155deg,#16161d_0%,#0c0c10_100%)] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.04),inset_0_1px_0_rgba(255,255,255,0.06)] max560:aspect-[3/4]">
        {/* menu bar */}
        <div className="absolute inset-x-0 top-0 z-[4] flex h-[30px] items-center justify-between bg-[linear-gradient(to_bottom,rgba(0,0,0,0.4),rgba(0,0,0,0.12))] px-[14px] text-white/92">
          <div className="flex items-center gap-[18px] text-[13px]">
            <span className="font-bold" />
            <span className="opacity-60">Finder</span>
            <span className="opacity-60">File</span>
            <span className="opacity-60">Edit</span>
            <span className="opacity-60">View</span>
          </div>
          <div className="flex items-center gap-[15px]">
            <span className="relative flex items-center rounded-[6px] bg-white/22 px-[6px] py-1 [&>svg]:h-[17px] [&>svg]:w-[17px] [&>svg]:text-[#ff8a8a]">
              <Icon id="logo-module" />
              <span className="absolute right-0 top-px h-[6px] w-[6px] rounded-full bg-accent shadow-[0_0_0_1.5px_rgba(0,0,0,0.3)]" />
            </span>
            <svg className="w-[18px] text-white/90" viewBox="0 0 24 20">
              <use href="#i-sun" />
            </svg>
            <svg
              className="w-[18px] text-white/90"
              viewBox="0 0 24 20"
              style={{ width: 22 }}
            >
              <use href="#i-battery" />
            </svg>
            <span className="text-[12.5px] font-medium">Mon&nbsp;9:41</span>
          </div>
        </div>

        {/* dropdown: recreation of the real menu-bar panel */}
        <GlassPanel className="absolute right-4 top-[42px] z-[6] w-[340px] max900:right-1/2 max900:w-[300px] max900:translate-x-1/2">
          <HeroPanel />
        </GlassPanel>

        {/* floating Packages card: the whole-machine inventory */}
        <GlassPanel className="absolute left-6 top-[70px] z-[5] w-[290px] pb-[6px] max900:hidden">
          <div className="flex items-center justify-between px-[14px] pb-[9px] pt-[11px]">
            <span className="flex items-center gap-2 font-display text-[13px] font-bold [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-accent">
              <Icon id="i-box" />
              Packages
            </span>
            <span className="font-mono text-[11px] text-ink-3">6 in use</span>
          </div>
          <PanelSep />
          <div className="flex flex-col px-[6px] pb-[2px] pt-1">
            <UiRow className="gap-[9px] px-2 py-[6px]">
              <Pico small>
                <Icon id="i-box" />
              </Pico>
              <RowMeta name="lodash" sub="12 projects · 2 versions" />
              <div className="flex flex-none items-center gap-[6px]">
                <Pill tone="unify">unify</Pill>
                <SizeLabel value="18" unit="MB" />
              </div>
            </UiRow>
            <UiRow className="gap-[9px] px-2 py-[6px]">
              <Pico small>
                <Icon id="i-box" />
              </Pico>
              <RowMeta name="next" sub="5 projects · v14.2.3" />
              <div className="flex flex-none items-center gap-[6px]">
                <Pill tone="upd">↑ 15.0.1</Pill>
                <SizeLabel value="128" unit="MB" />
              </div>
            </UiRow>
            <UiRow className="gap-[9px] px-2 py-[6px]">
              <Pico small sev>
                <Icon id="i-shield" />
              </Pico>
              <RowMeta name="minimatch" sub="3 projects · v3.0.4" />
              <div className="flex flex-none items-center gap-[6px]">
                <Pill tone="sev">
                  <Icon id="i-alert" />
                  high
                </Pill>
                <SizeLabel value="512" unit="KB" />
              </div>
            </UiRow>
          </div>
        </GlassPanel>

        {/* floating toast */}
        <div className="absolute bottom-[22px] left-[22px] z-[7] flex items-center gap-[10px] rounded-[13px] border border-[rgba(52,211,153,0.4)] bg-[rgba(18,18,21,0.92)] px-[15px] py-[11px] shadow-[0_16px_40px_rgba(0,0,0,0.5)] max900:hidden">
          <svg className="h-[19px] w-[19px] text-ok" viewBox="0 0 24 24">
            <use href="#i-checkcircle" />
          </svg>
          <span>
            <b className="font-semibold">Reclaimed 612 MB</b> &nbsp;
            <span className="text-[13px] text-ink-3">legacy-dashboard</span>
          </span>
        </div>
      </div>
    </div>
  );
}
