import { cn } from "@/lib/utils";
import type { UiRowProps } from "./ui-mock.types";

export function UiRow({ highlighted, className, children }: UiRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-[11px] rounded-[9px] px-[9px] py-[7px]",
        highlighted &&
          "bg-white/7 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
