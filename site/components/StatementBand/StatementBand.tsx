import { Pixrow } from "@/components/Pixrow";
import { Wrap } from "@/components/Wrap";
import type { Dictionary } from "@/lib/i18n";

export interface StatementBandProps {
  dict: Dictionary;
}

export function StatementBand({ dict }: StatementBandProps) {
  return (
    <section className="reveal relative mt-[92px] border-y border-line bg-[rgba(255,255,255,0.015)] py-[30px]">
      <Wrap className="flex flex-wrap items-center justify-center gap-[30px] text-center">
        <Pixrow />
        <div className="max-w-[22ch] font-display text-[clamp(20px,2.6vw,30px)] font-bold tracking-[-0.02em] [&_code]:bg-white/6 [&_code]:text-ink [&_em]:not-italic [&_em]:text-accent">
          {dict.band.statement}
        </div>
        <Pixrow mirror />
      </Wrap>
    </section>
  );
}
