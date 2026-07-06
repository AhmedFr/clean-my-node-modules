import type { SizeLabelProps } from "./ui-mock.types";

export function SizeLabel({ value, unit }: SizeLabelProps) {
  return (
    <span className="text-[12.5px] font-[650] tabular-nums text-ink-2">
      {value}
      <span className="ml-[2px] text-[11px] text-ink-4">{unit}</span>
    </span>
  );
}
