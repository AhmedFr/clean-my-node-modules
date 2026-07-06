import { cn } from "@/lib/utils";
import type { RowMetaProps } from "./ui-mock.types";

export function RowMeta({ name, sub, mono }: RowMetaProps) {
  return (
    <div className="min-w-0 flex-1">
      <div className="truncate text-[13px] font-semibold">{name}</div>
      <div className={cn("text-[11px] text-ink-3", mono && "font-mono")}>
        {sub}
      </div>
    </div>
  );
}
