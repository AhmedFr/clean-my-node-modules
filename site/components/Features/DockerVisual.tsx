import { Icon } from "@/components/Icon";
import {
  GlassPanel,
  PanelSep,
  RowMeta,
  SizeLabel,
  UiRow,
} from "@/components/ui-mock";

// Feature 5: the Docker tab, resources grouped by the project they belong to.
export function DockerVisual() {
  return (
    <GlassPanel className="w-full max-w-[480px] overflow-hidden rounded-[14px]">
      <div className="flex items-center gap-[11px] px-[14px] py-[11px]">
        <span className="grid h-6 w-6 flex-none place-items-center rounded-[7px] bg-[linear-gradient(155deg,#8ad0ff,#2f7fd2)] [&_svg]:h-[14px] [&_svg]:w-[14px] [&_svg]:text-white">
          <Icon id="i-docker" />
        </span>
        <div className="ml-auto flex gap-[3px] rounded-[9px] bg-black/25 p-[3px]">
          <span className="rounded-[6px] px-[10px] py-1 text-[11.5px] font-semibold text-ink-3">
            Projects
          </span>
          <span className="rounded-[6px] px-[10px] py-1 text-[11.5px] font-semibold text-ink-3">
            Caches
          </span>
          <span className="rounded-[6px] bg-white/10 px-[10px] py-1 text-[11.5px] font-semibold text-ink">
            Docker
          </span>
        </div>
      </div>
      <PanelSep />
      <div className="flex items-center justify-between px-4 pb-1 pt-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-3">
          23.6 GB · grouped by project
        </span>
      </div>
      <div className="flex flex-col px-[6px] py-[5px]">
        <UiRow className="gap-[10px] px-2 py-[7px]">
          <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-[7px] bg-[rgba(97,218,251,0.14)] text-[13px]">
            🐳
          </span>
          <RowMeta name="api-gateway" sub="2 images · 1 volume · 1 container" />
          <SizeLabel value="9.4" unit="GB" />
        </UiRow>
        <UiRow className="gap-[10px] px-2 py-[7px]">
          <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-[7px] bg-[rgba(126,194,65,0.14)] text-[13px]">
            🐘
          </span>
          <RowMeta name="postgres-dev" sub="1 image · 2 volumes" />
          <SizeLabel value="6.1" unit="GB" />
        </UiRow>
        <UiRow className="gap-[10px] px-2 py-[7px]">
          <span className="grid h-[26px] w-[26px] flex-none place-items-center rounded-[7px] bg-white/[0.06] [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:text-ink-3">
            <Icon id="i-layers" />
          </span>
          <RowMeta name="Not linked to a project" sub="dangling images · build cache" />
          <SizeLabel value="8.1" unit="GB" />
        </UiRow>
      </div>
    </GlassPanel>
  );
}
