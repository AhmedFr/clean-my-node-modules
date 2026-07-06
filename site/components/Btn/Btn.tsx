import { cn } from "@/lib/utils";
import type { BtnProps } from "./Btn.types";

const BASE =
  "inline-flex cursor-pointer items-center gap-[9px] whitespace-nowrap border border-transparent font-ui font-semibold [transition:transform_.14s_cubic-bezier(.2,.8,.2,1),box-shadow_.2s,background_.2s,border-color_.2s] [&_svg]:h-[17px] [&_svg]:w-[17px]";

const VARIANTS = {
  primary:
    "bg-[linear-gradient(180deg,#ff7373,var(--color-accent-deep))] text-white shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_8px_22px_-8px_rgba(226,61,61,0.7)] hover:-translate-y-[2px] hover:shadow-[0_1px_0_rgba(255,255,255,0.3)_inset,0_14px_30px_-8px_rgba(226,61,61,0.8)]",
  ghost:
    "border-line-2 bg-white/5 text-ink hover:-translate-y-[2px] hover:bg-white/10",
} as const;

const SIZES = {
  sm: "rounded-[9px] px-[15px] py-2 text-[14px]",
  md: "rounded-[11px] px-[19px] py-[11px] text-[15px]",
  lg: "rounded-[13px] px-[26px] py-[15px] text-[16.5px]",
} as const;

// Anchor-styled CTA. All current call sites navigate, so this is an <a>;
// grow a <button> twin if a non-navigation use ever appears.
export function Btn({
  variant,
  size = "md",
  className,
  children,
  ...anchor
}: BtnProps) {
  return (
    <a className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...anchor}>
      {children}
    </a>
  );
}
