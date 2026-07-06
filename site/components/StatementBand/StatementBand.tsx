import { Pixrow } from "@/components/Pixrow";
import { Wrap } from "@/components/Wrap";

export function StatementBand() {
  return (
    <section className="reveal relative mt-[92px] border-y border-line bg-[rgba(255,255,255,0.015)] py-[30px]">
      <Wrap className="flex flex-wrap items-center justify-center gap-[30px] text-center">
        <Pixrow />
        <div className="max-w-[22ch] font-display text-[clamp(20px,2.6vw,30px)] font-bold tracking-[-0.02em] [&_code]:bg-white/6 [&_code]:text-ink [&_em]:not-italic [&_em]:text-accent">
          <code>node_modules</code> is the heaviest object in the known
          universe. <em>We help you delete it.</em>
        </div>
        <Pixrow mirror />
      </Wrap>
    </section>
  );
}
