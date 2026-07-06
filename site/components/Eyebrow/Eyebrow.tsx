import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The dot-badge chip above hero/section headings.
export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[rgba(255,99,99,0.28)] bg-[rgba(255,99,99,0.07)] py-[6px] pl-[10px] pr-[13px] font-mono text-[12.5px] font-medium uppercase tracking-[0.04em] text-accent",
        className,
      )}
    >
      <span className="h-[6px] w-[6px] rounded-full bg-accent shadow-[0_0_0_3px_rgba(255,99,99,0.25)]" />
      {children}
    </div>
  );
}
