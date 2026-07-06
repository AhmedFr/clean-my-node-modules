import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// The site's content column: 1160px, 28px gutters (18px under 560px).
export function Wrap({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1160px] px-7 max560:px-[18px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
