import { cn } from "@/lib/utils";
import type { PillProps } from "./ui-mock.types";

const TONES = {
  sev: "text-accent shadow-[inset_0_0_0_1px_rgba(255,99,99,0.75)]",
  unify: "text-[#fbbf24] shadow-[inset_0_0_0_1px_rgba(251,191,36,0.7)]",
  upd: "text-ok shadow-[inset_0_0_0_1px_rgba(52,211,153,0.65)]",
} as const;

export function Pill({ tone, children }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center gap-[3px] whitespace-nowrap rounded-full bg-white/6 px-[7px] py-[2px] text-[10.5px] font-[650] leading-[1.4] [&_svg]:h-[11px] [&_svg]:w-[11px]",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
