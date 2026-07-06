import { Icon } from "@/components/Icon";
import { GlassPanel } from "@/components/ui-mock";

// Feature 1: the threshold notification banner.
export function NotifVisual() {
  return (
    <GlassPanel className="flex w-full max-w-[360px] items-start gap-3 p-[14px]">
      <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[10px] bg-[linear-gradient(160deg,#ff7373,#c23030)] text-white shadow-[0_4px_14px_rgba(180,40,40,0.4)] [&_svg]:h-5 [&_svg]:w-5">
        <Icon id="i-alert" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between">
          <span className="text-[12.5px] font-bold">TidyDisk</span>
          <span className="text-[11px] text-ink-4">now</span>
        </div>
        <div className="mt-[3px] text-[12.5px] leading-[1.45] text-ink-2">
          You&apos;ve crossed your limit:{" "}
          <b className="text-white">5.42 GB</b> of stale dependencies are
          taking up space.
        </div>
        <div className="mt-[10px] flex gap-2">
          <button className="flex-1 cursor-pointer rounded-lg bg-[linear-gradient(180deg,#ff7373,var(--color-accent-deep))] px-[11px] py-[7px] font-ui text-[12.5px] font-[650] text-white">
            Review &amp; clean
          </button>
          <button className="cursor-pointer rounded-lg bg-white/8 px-[11px] py-[7px] font-ui text-[12.5px] font-[650] text-ink-2">
            Later
          </button>
        </div>
      </div>
    </GlassPanel>
  );
}
