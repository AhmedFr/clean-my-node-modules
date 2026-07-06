import type { ReactNode } from "react";

export interface SectionHeadProps {
  kicker: string;
  heading: ReactNode;
  lead?: ReactNode;
}

export function SectionHead({ kicker, heading, lead }: SectionHeadProps) {
  return (
    <div className="reveal mx-auto max-w-[720px] text-center">
      <div className="font-mono text-[12.5px] font-medium uppercase tracking-[0.06em] text-accent">
        {kicker}
      </div>
      <h2 className="mt-[14px] font-display text-[clamp(30px,4.4vw,50px)] font-extrabold leading-[1.02] tracking-[-0.025em]">
        {heading}
      </h2>
      {lead ? (
        <p className="mx-auto mt-4 max-w-[600px] text-[18px] text-ink-2">
          {lead}
        </p>
      ) : null}
    </div>
  );
}
