import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/Icon";

export interface FeatureRowProps {
  num: string;
  tagline: string;
  heading: ReactNode;
  body: ReactNode;
  bullets: ReactNode[];
  visual: ReactNode;
  /** Visual column first on desktop (stacks normally under 900px). */
  flip?: boolean;
  id?: string;
}

export function FeatureRow({
  num,
  tagline,
  heading,
  body,
  bullets,
  visual,
  flip,
  id,
}: FeatureRowProps) {
  return (
    <div
      className="grid grid-cols-2 items-center gap-[60px] max900:grid-cols-1 max900:gap-8"
      id={id}
    >
      <div className="reveal">
        <span className="inline-flex items-center gap-2 whitespace-nowrap font-mono text-[12px] font-medium uppercase tracking-[0.05em] text-accent">
          <span className="grid h-[22px] w-[22px] place-items-center rounded-[6px] bg-[rgba(255,99,99,0.14)] text-[11px]">
            {num}
          </span>
          {tagline}
        </span>
        <h3 className="mt-4 font-display text-[clamp(26px,3.2vw,38px)] font-bold leading-[1.06] tracking-[-0.02em]">
          {heading}
        </h3>
        <p className="mt-4 max-w-[46ch] text-[17px] text-ink-2 [&_code]:border-[rgba(255,99,99,0.18)] [&_code]:bg-[rgba(255,99,99,0.08)] [&_code]:text-accent">
          {body}
        </p>
        <ul className="mt-[22px] flex flex-col gap-[11px]">
          {bullets.map((bullet, i) => (
            <li
              key={i}
              className="flex items-start gap-[11px] text-[15.5px] text-ink-2"
            >
              <span className="mt-px grid h-5 w-5 flex-none place-items-center rounded-[6px] bg-[rgba(255,99,99,0.16)] text-accent [&_svg]:h-[13px] [&_svg]:w-[13px]">
                <Icon id="i-check" />
              </span>
              {bullet}
            </li>
          ))}
        </ul>
      </div>
      <div
        className={cn(
          "reveal d1 relative",
          flip && "-order-1 max900:order-none",
        )}
      >
        <div className="absolute -z-[1] rounded-full bg-[radial-gradient(closest-side,rgba(255,99,99,0.26),transparent)] blur-[46px] [inset:12%_18%]" />
        <div className="relative grid min-h-[320px] place-items-center overflow-hidden rounded-2xl border border-line-2 bg-[radial-gradient(600px_300px_at_70%_0%,#2a1c34_0%,transparent_60%),linear-gradient(160deg,#15151b,#0d0d11)] p-[34px] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)]">
          {visual}
        </div>
      </div>
    </div>
  );
}
