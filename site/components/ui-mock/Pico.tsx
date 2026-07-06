import { cn } from "@/lib/utils";
import type { PicoProps } from "./ui-mock.types";

// Package-icon chip used by the packages mocks.
export function Pico({ sev, small, children }: PicoProps) {
  return (
    <span
      className={cn(
        "grid flex-none place-items-center rounded-[8px] bg-white/6 text-ink-3",
        small
          ? "h-[26px] w-[26px] [&_svg]:h-[13px] [&_svg]:w-[13px]"
          : "h-[30px] w-[30px] [&_svg]:h-[15px] [&_svg]:w-[15px]",
        sev && "text-accent",
      )}
    >
      {children}
    </span>
  );
}
